export interface Task {
	id: string
	title: string
	description?: string
	completed: boolean
	category: TaskCategory
	createdAt: string
}

export type TaskCategory = 'work' | 'personal' | 'shopping' | 'other'

export interface TaskFormData {
	title: string
	description?: string
	category: TaskCategory
}
