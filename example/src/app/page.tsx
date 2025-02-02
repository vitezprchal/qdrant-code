"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Task, TaskFormData } from "../types/task";
import { TaskForm } from "../components/TaskForm";
import { TaskList, TaskFilters } from "../components/TaskList";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<Task["category"] | "all">(
    "all"
  );

  const handleAddTask = (formData: TaskFormData) => {
    const newTask: Task = {
      id: uuidv4(),
      title: formData.title,
      description: formData.description,
      completed: false,
      category: formData.category,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Personal Task Manager
        </h1>

        <TaskForm onSubmit={handleAddTask} />

        <TaskFilters
          filter={filter}
          onFilterChange={setFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
        />

        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          filter={filter}
          categoryFilter={categoryFilter}
        />

        <div className="mt-6 text-center text-sm text-gray-500">
          {tasks.length === 0
            ? "No tasks yet. Add your first task above!"
            : `${tasks.length} total task${tasks.length === 1 ? "" : "s"}`}
        </div>
      </div>
    </main>
  );
}
