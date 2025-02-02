export interface CodeMetadata {
	language?: string
	filename?: string
	author?: string
	[key: string]: any
}

export interface CodeChunk {
	id: number
	vector: number[]
	payload: {
		text: string
		chunkIndex: number
		totalChunks: number
	} & CodeMetadata
}

export interface SearchResult {
	text: string
	score: number
	metadata: {
		chunkIndex: number
		totalChunks: number
	} & CodeMetadata
} 