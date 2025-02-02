"use client";

import { Task, TaskCategory } from "../types/task";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  filter: "all" | "active" | "completed";
  categoryFilter: TaskCategory | "all";
}

export function TaskList({
  tasks,
  onToggleComplete,
  onDelete,
  filter,
  categoryFilter,
}: TaskListProps) {
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed);

    const matchesCategory =
      categoryFilter === "all" || task.category === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No tasks found. Create a new task to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function TaskFilters({
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
}: {
  filter: "all" | "active" | "completed";
  onFilterChange: (filter: "all" | "active" | "completed") => void;
  categoryFilter: TaskCategory | "all";
  onCategoryFilterChange: (category: TaskCategory | "all") => void;
}) {
  const categories: (TaskCategory | "all")[] = [
    "all",
    "work",
    "personal",
    "shopping",
    "other",
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex space-x-2">
        <button
          onClick={() => onFilterChange("all")}
          className={`px-4 py-2 rounded-md ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange("active")}
          className={`px-4 py-2 rounded-md ${
            filter === "active"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => onFilterChange("completed")}
          className={`px-4 py-2 rounded-md ${
            filter === "completed"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Completed
        </button>
      </div>

      <select
        value={categoryFilter}
        onChange={(e) =>
          onCategoryFilterChange(e.target.value as TaskCategory | "all")
        }
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === "all"
              ? "All Categories"
              : category.charAt(0).toUpperCase() + category.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
