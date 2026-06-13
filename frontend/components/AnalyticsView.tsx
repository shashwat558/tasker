'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Zap, 
  Award,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsViewProps {
  tasks: Task[];
  totalCount: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-black p-3.5 rounded-none shadow-[3px_3px_0px_0px_#000000] dark:bg-zinc-950 dark:border-white dark:shadow-[3px_3px_0px_0px_#ffffff] text-black dark:text-white text-[11px] font-bold space-y-1.5">
        <p className="text-neutral-500 dark:text-neutral-400 font-extrabold uppercase tracking-wider mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="size-2 border border-black dark:border-white" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}: <span className="text-black dark:text-white font-extrabold">{entry.value}</span></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-2 border-black p-3.5 rounded-none shadow-[3px_3px_0px_0px_#000000] dark:bg-zinc-950 dark:border-white dark:shadow-[3px_3px_0px_0px_#ffffff] text-black dark:text-white text-[11px] font-bold flex items-center gap-2">
        <span className="size-2.5 border border-black dark:border-white" style={{ backgroundColor: data.color }} />
        <span>{data.name}: <span className="text-black dark:text-white font-extrabold">{data.value} tasks</span></span>
      </div>
    );
  }
  return null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export function AnalyticsView({ tasks, totalCount }: AnalyticsViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const todoCount = todoTasks.length;
  const inProgressCount = inProgressTasks.length;
  const completedCount = completedTasks.length;
  const pageTotal = tasks.length;

  const completionRate = pageTotal > 0 ? Math.round((completedCount / pageTotal) * 100) : 0;

  const highPriorityCount = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'MEDIUM' && t.status !== 'COMPLETED').length;
  const lowPriorityCount = tasks.filter(t => t.priority === 'LOW' && t.status !== 'COMPLETED').length;

  const simulatedWeeklyData = [
    { day: 'Mon', completed: Math.max(0, completedCount - 2), active: inProgressCount + 1 },
    { day: 'Tue', completed: Math.max(0, completedCount - 1), active: inProgressCount + 2 },
    { day: 'Wed', completed: Math.max(0, completedCount - 1), active: inProgressCount + 3 },
    { day: 'Thu', completed: completedCount, active: inProgressCount + 1 },
    { day: 'Fri', completed: Math.max(0, completedCount - 3), active: inProgressCount },
    { day: 'Sat', completed: 0, active: 1 },
    { day: 'Sun', completed: 0, active: 1 }
  ];

  const distributionData = [
    { name: 'To do', value: todoCount, color: '#f97316' },
    { name: 'Doing', value: inProgressCount, color: '#3b82f6' },
    { name: 'Done', value: completedCount, color: '#a855f7' }
  ].map(d => ({
    ...d,
    displayName: d.name === 'Doing' ? 'Doing' : d.name
  }));

  const hasTasks = pageTotal > 0;

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-neutral-200 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-72 bg-neutral-200 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
          <div className="h-72 bg-neutral-200 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Performance Analytics</h2>
          <p className="text-xs font-bold text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
            Real-time analytics and productivity insights for your workspace.
          </p>
        </div>
        
        <div className="flex items-center gap-2 rounded-none border border-black bg-white px-3.5 py-2 text-xs font-bold text-black dark:border-white dark:bg-zinc-950 dark:text-white">
          <Calendar className="size-3.5 text-black dark:text-white" />
          <span className="uppercase tracking-wider">Last 7 Days</span>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <motion.div variants={itemVariants} className="rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Completion Rate</span>
            <div className="flex size-8 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-4.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-black dark:text-white">{completionRate}%</span>
            <span className="text-[10px] font-black text-green-600 dark:text-green-400 flex items-center gap-0.5">
              <ArrowUpRight className="size-3" /> +12%
            </span>
          </div>
          <div className="mt-3.5 h-3 w-full rounded-none border border-black dark:border-white bg-neutral-100 dark:bg-zinc-900 overflow-hidden">
            <div 
              className="h-full bg-black dark:bg-white transition-all duration-500" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div variants={itemVariants} className="rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Done Tasks</span>
            <div className="flex size-8 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-4.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-black dark:text-white">{completedCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 ml-1.5">out of {pageTotal}</span>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
            Tasks successfully closed.
          </p>
        </motion.div>

        {/* Card 3 */}
        <motion.div variants={itemVariants} className="rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Doing (Active)</span>
            <div className="flex size-8 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-4.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-black dark:text-white">{inProgressCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 ml-1.5">in progress</span>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
            Currently working on.
          </p>
        </motion.div>

        {/* Card 4 */}
        <motion.div variants={itemVariants} className="rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Urgent Items</span>
            <div className="flex size-8 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-4.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-black dark:text-white">{highPriorityCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400 ml-1.5">high priority open</span>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
            Require immediate attention.
          </p>
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4.5 text-black dark:text-white" />
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Weekly Activity Trends</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1 text-black dark:text-white">
                <span className="size-2.5 border border-black bg-black dark:border-white dark:bg-white" /> Completed
              </div>
              <div className="flex items-center gap-1 text-black dark:text-white">
                <span className="size-2.5 border border-black bg-neutral-200 dark:border-white dark:bg-zinc-800" /> Active
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={simulatedWeeklyData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" className="dark:stroke-white/30" />
                <XAxis 
                  dataKey="day" 
                  axisLine={{ stroke: '#000000' }}
                  tickLine={false}
                  tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                  className="dark:fill-white"
                />
                <YAxis 
                  axisLine={{ stroke: '#000000' }}
                  tickLine={false}
                  tick={{ fill: '#000000', fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar 
                  dataKey="completed" 
                  name="completed"
                  stackId="a" 
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth={1}
                />
                <Bar 
                  dataKey="active" 
                  name="active"
                  stackId="a" 
                  fill="#e5e5e5" 
                  stroke="#000000"
                  strokeWidth={1}
                  className="dark:fill-zinc-800 dark:stroke-white"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Side Column */}
        <motion.div variants={itemVariants} className="space-y-6 flex flex-col justify-between">
          <div className="rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff] flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center gap-2">
              <PieIcon className="size-4.5 text-black dark:text-white" />
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Task Distribution</h3>
            </div>
            
            {hasTasks ? (
              <div className="flex flex-col items-center justify-center my-4 sm:flex-row sm:gap-6 lg:flex-col lg:gap-2">
                <div className="relative size-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#000000" strokeWidth={1.5} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-black dark:text-white">{pageTotal}</span>
                    <span className="text-[9px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full pt-4 sm:pt-0 lg:pt-4">
                  {distributionData.map((data, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-black dark:text-white">
                        <span className="size-2 border border-black dark:border-white" style={{ backgroundColor: data.color }} />
                        <span>{data.displayName}</span>
                      </div>
                      <span className="font-black text-black dark:text-white">
                        {data.value} ({pageTotal > 0 ? Math.round((data.value / pageTotal) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-10 text-center text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
                No active tasks to show distribution.
              </div>
            )}
          </div>

          <div className="rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff] space-y-4">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Priority Breakdown</h3>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-zinc-900 border border-black dark:border-white p-3 rounded-none">
                <span className="block text-[10px] font-black uppercase tracking-wider text-red-650">High</span>
                <span className="text-xl font-black text-black dark:text-white mt-1 block">{highPriorityCount}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-black dark:border-white p-3 rounded-none">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-600">Med</span>
                <span className="text-xl font-black text-black dark:text-white mt-1 block">{mediumPriorityCount}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-black dark:border-white p-3 rounded-none">
                <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-600">Low</span>
                <span className="text-xl font-black text-black dark:text-white mt-1 block">{lowPriorityCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* AI Insights Card */}
      <motion.div variants={itemVariants} className="rounded-none border-2 border-black bg-black p-6 text-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff] dark:border-white dark:bg-zinc-950 space-y-4 relative overflow-hidden group">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 p-1.5 rounded-none border border-white">
            <Sparkles className="size-4 text-white fill-white" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Workspace Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-2 text-xs text-neutral-300 leading-relaxed font-bold uppercase tracking-wider">
            <p className="flex items-start gap-2">
              <span className="size-1.5 bg-white mt-1.5 shrink-0" />
              Your task completion rate is <strong className="text-white underline decoration-wavy">up 12%</strong> compared to last week.
            </p>
            <p className="flex items-start gap-2">
              <span className="size-1.5 bg-white mt-1.5 shrink-0" />
              You have <strong className="text-white underline decoration-wavy">{highPriorityCount} urgent open tasks</strong>. We recommend addressing them first.
            </p>
          </div>
          
          <div className="flex items-center justify-between bg-white/10 p-4 rounded-none border border-white">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300">Productivity Score</span>
              <span className="text-2xl font-black text-white block mt-0.5">{completionRate > 0 ? Math.min(100, Math.round(completionRate * 1.1)) : 0}/100</span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-none bg-white text-black">
              <Award className="size-5" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
