import { QdrantClient } from "@qdrant/qdrant-js";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CodeChunk } from './types.js'
import { CodeMetadata, SearchResult } from './types.js'
import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333", apiKey: process.env.QDRANT_API_KEY || "" });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const COLLECTION_NAME = "code_embeddings";
const VECTOR_SIZE = 1536; // ada-002 embeddings
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const QUERY_EXAMPLE = "What task categories are there?";
        

async function getCodeFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(directory: string) {
        const entries = await readdir(directory, { withFileTypes: true });
        
        for (const entry of entries) {
            const path = join(directory, entry.name);
            
            if (entry.isDirectory()) {
                await scan(path);
            } else {
                const ext = extname(path).toLowerCase();
                if (EXTENSIONS.includes(ext)) {
                    files.push(path);
                }
            }
        }
    }
    
    await scan(dir);
    return files;
}

function getLanguageFromFile(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case '.ts':
        case '.tsx':
            return 'typescript';
        case '.js':
        case '.jsx':
            return 'javascript';
        default:
            return 'unknown';
    }
}

async function initializeCollection(): Promise<void> {
    try {
        const collections = await qdrant.getCollections();
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

        if (!exists) {
            await qdrant.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: "Cosine"
                },
                optimizers_config: {
                    default_segment_number: 2
                },
                replication_factor: 1
            });

            console.log(`Collection ${COLLECTION_NAME} created successfully`);
        }
    } catch (error) {
        console.error("Error initializing collection:", error);
        throw error;
    }
}

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            input: text,
            model: "text-embedding-ada-002"
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

async function storeCodeEmbeddings(code: string, metadata: CodeMetadata = {}): Promise<void> {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });
        
        const chunks = await splitter.splitText(code);
        
        const points: CodeChunk[] = await Promise.all(
            chunks.map(async (chunk, index) => {
                const embedding = await generateEmbedding(chunk);
                return {
                    id: Date.now() + index,
                    vector: embedding,
                    payload: {
                        text: chunk,
                        chunkIndex: index,
                        totalChunks: chunks.length,
                        ...metadata
                    }
                };
            })
        );

        await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points
        });

        console.log(`Stored ${chunks.length} code chunks in Qdrant for file: ${metadata.filename}`);
    } catch (error) {
        console.error("Error storing code embeddings:", error);
        throw error;
    }
}

async function searchSimilarCode(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const results = await qdrant.search(COLLECTION_NAME, {
            vector: queryEmbedding,
            limit,
            with_payload: true,
            with_vector: false
        });

        return results.map(result => ({
            text: result.payload?.text as string,
            score: result.score,
            metadata: {
                chunkIndex: result.payload?.chunkIndex as number,
                totalChunks: result.payload?.totalChunks as number,
                ...(result.payload as CodeMetadata)
            }
        }));
    } catch (error) {
        console.error("Error searching code:", error);
        throw error;
    }
}

async function processExampleProject(): Promise<void> {
    try {
        console.log("Processing example project...");
        const exampleDir = join(process.cwd(), 'example/src');
        const files = await getCodeFiles(exampleDir);
        
        console.log(`Found ${files.length} code files to process`);
        
        for (const file of files) {
            const code = await readFile(file, 'utf-8');
            const relativePath = file.replace(process.cwd(), '');
            
            console.log(`Processing file: ${relativePath}`);
            
            await storeCodeEmbeddings(code, {
                language: getLanguageFromFile(file),
                filename: relativePath,
                filePath: relativePath
            });
        }
        
        console.log("Example project processing completed");
    } catch (error) {
        console.error("Error processing example project:", error);
        throw error;
    }
}

async function main(): Promise<void> {
    try {
        console.log("Initializing...");
        await initializeCollection();
        
        await processExampleProject();
        
		console.log(`\nSearching for '${QUERY_EXAMPLE}'...`);
        const searchResults = await searchSimilarCode(QUERY_EXAMPLE);
        console.log("Search Results:", JSON.stringify(searchResults, null, 2));
    } catch (error) {
        console.error("Error in main:", error);
        process.exit(1);
    }
}

main();
