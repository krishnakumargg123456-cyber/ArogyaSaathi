"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface FollowUpTask {
  id: string;
  patient_id: string;
  patient_name: string | null;
  task_type: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string | null;
}

export function TasksCenterScreen() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as {
        access_token?: string;
        role?: string;
      } | null;
      if (!session?.access_token || !session.role) {
        setError("Sign in with a health-worker account to view assigned tasks.");
        setLoading(false);
        return;
      }
      setToken(session.access_token);
    } catch {
      setError("Your saved session is invalid. Sign in again to continue.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<FollowUpTask[]>("/tasks", {}, token)
      .then((records) => {
        if (active) setTasks(records);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load assigned tasks.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function completeTask(taskId: string) {
    setUpdatingTaskId(taskId);
    setError("");
    try {
      await apiRequest<{ status: string }>(`/tasks/${taskId}/complete`, { method: "PATCH" }, token);
      setTasks((current) => current.map((task) => (
        task.id === taskId ? { ...task, status: "COMPLETED" } : task
      )));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not complete this task.");
    } finally {
      setUpdatingTaskId("");
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Assigned follow-up tasks</h2>
          <p className="text-[11px] text-gray-500">Live tasks assigned to your account</p>
        </div>
        {loading && <RefreshCw className="h-4 w-4 animate-spin text-emerald-700" aria-label="Loading tasks" />}
      </div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          {error}
          {!token && <Link href="/worker-login" className="ml-1 font-bold underline">Sign in</Link>}
        </p>
      )}
      {!loading && token && tasks.length === 0 && !error && (
        <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">No follow-up tasks are assigned to your account.</p>
      )}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{task.task_type.replaceAll("_", " ")}</p>
              <p className="mt-0.5 text-[11px] text-slate-600">{task.patient_name ?? "Patient"} · Due {new Date(task.due_date).toLocaleDateString()}</p>
              {task.notes && <p className="mt-1 text-[11px] text-slate-500">{task.notes}</p>}
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                task.priority === "URGENT" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
              }`}>{task.priority} · {task.status}</span>
            </div>
            {task.status !== "COMPLETED" && (
              <button
                type="button"
                disabled={updatingTaskId === task.id}
                onClick={() => void completeTask(task.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-800 px-2.5 py-2 text-[10px] font-bold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {updatingTaskId === task.id ? "Saving…" : "Complete"}
              </button>
            )}
            {task.status === "COMPLETED" && <Clock className="h-4 w-4 shrink-0 text-emerald-700" aria-label="Completed" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
