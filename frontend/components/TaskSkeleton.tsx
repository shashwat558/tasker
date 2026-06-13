'use client';

import React from 'react';

export function TaskSkeleton() {
  return (
    <div className="flex flex-col rounded-none border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[3px_3px_0px_0px_#ffffff] animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="h-5 w-2/3 rounded-none bg-neutral-200 dark:bg-zinc-800" />
        <div className="h-5 w-5 rounded-none bg-neutral-200 dark:bg-zinc-800" />
      </div>

      <div className="space-y-2 mt-3">
        <div className="h-3 w-full rounded-none bg-neutral-100 dark:bg-zinc-800" />
        <div className="h-3 w-4/5 rounded-none bg-neutral-100 dark:bg-zinc-800" />
      </div>

      <div className="flex gap-1.5 mt-4">
        <div className="h-4.5 w-12 rounded-none bg-neutral-200 dark:bg-zinc-800" />
        <div className="h-4.5 w-14 rounded-none bg-neutral-200 dark:bg-zinc-800" />
      </div>

      <div className="my-4 border-t border-dashed border-black dark:border-white" />

      <div className="flex items-center justify-between mb-3.5">
        <div className="h-3.5 w-28 rounded-none bg-neutral-100 dark:bg-zinc-800" />
        <div className="h-3.5 w-8 rounded-none bg-neutral-100 dark:bg-zinc-800" />
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-1.5">
          <div className="size-6 rounded-none bg-neutral-200 dark:bg-zinc-800 border border-black dark:border-white" />
          <div className="size-6 rounded-none bg-neutral-200 dark:bg-zinc-800 border border-black dark:border-white" />
        </div>
        <div className="flex gap-2">
          <div className="size-5 rounded-none bg-neutral-200 dark:bg-zinc-800 border border-black dark:border-white" />
          <div className="size-5 rounded-none bg-neutral-200 dark:bg-zinc-800 border border-black dark:border-white" />
        </div>
      </div>
    </div>
  );
}
