import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp, CalendarDays, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '@/pages/Index';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onEditTask: (task: Task) => void;
  onRescheduleTask: (taskId: string, newDate: string, newTime?: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedDate,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onEditTask,
  onRescheduleTask,
}) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const getStatusForTaskDate = (task: Task, date: string): Task['status'] => {
    if (task.isEvent) {
      return task.perDayStatus?.[date] || 'pending';
    }
    return task.status;
  };

const handleCheckboxChange = (taskId: string, checked: boolean) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (task.isEvent) {
    const newPerDayStatus = { 
      ...task.perDayStatus, 
      [selectedDate]: checked ? 'completed' : 'pending' 
    };
    onUpdateTask(taskId, { 
      perDayStatus: newPerDayStatus,
      ...(checked && { failed: null }) // Set failed to null instead of undefined
    });
  } else {
    onUpdateTask(taskId, { 
      status: checked ? 'completed' : 'pending',
      ...(checked && { failed: null }) // Set failed to null instead of undefined
    });
  }
};
  const toggleDescription = (taskId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleOpenRescheduleDialog = (task: Task) => {
    setTaskToReschedule(task);
    setNewDate(task.date);
    setNewTime(task.time || '');
    setRescheduleDialogOpen(true);
  };

  const handleRescheduleSubmit = () => {
    if (!taskToReschedule) return;
    try {
      onRescheduleTask(taskToReschedule.id, newDate, taskToReschedule.time ? newTime : undefined);
      setRescheduleDialogOpen(false);
    } catch (error) {
      console.error('Error rescheduling task:', error);
    }
  };

  const activeTasks = tasks.filter((task) => {
    const status = getStatusForTaskDate(task, selectedDate);
    return status !== 'completed' && status !== 'failed';
  });
  
  const completedTasks = tasks.filter((task) => getStatusForTaskDate(task, selectedDate) === 'completed');
  const failedTasks = tasks.filter((task) => getStatusForTaskDate(task, selectedDate) === 'failed');

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '✓ Completed';
      case 'in-progress': return '⏳ In Progress';
      case 'failed': return '❌ Failed';
      case 'pending':
      default: return '⏸️ Pending';
    }
  };

  const formatEventDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) return format(start, 'MMM d');
    if (start.getMonth() === end.getMonth()) return `${format(start, 'MMM d')}-${format(end, 'd')}`;
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === targetTaskId) return;

    const draggedIndex = tasks.findIndex((t) => t.id === draggedTask);
    const targetIndex = tasks.findIndex((t) => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...tasks];
    const [removed] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, removed);
    onReorderTasks(newTasks);
    setDraggedTask(null);
  };

  const handleDragEnd = () => setDraggedTask(null);

  const renderTask = (task: Task, isCompleted = false, isFailed = false) => {
    const statusForDate = getStatusForTaskDate(task, selectedDate);

    return (
      <Card
        key={task.id}
        className={`transition-all duration-200 hover:shadow-md cursor-move border-l-4 ${
          statusForDate === 'completed'
            ? 'border-l-green-500 bg-green-50/30 opacity-75'
            : statusForDate === 'in-progress'
            ? 'border-l-blue-500 bg-blue-50/30'
            : statusForDate === 'failed'
            ? 'border-l-red-500 bg-red-50/30'
            : 'border-l-gray-500 bg-gray-50/30'
        } ${draggedTask === task.id ? 'opacity-50 scale-95' : ''} ${
          task.isEvent ? 'border-l-purple-500 bg-purple-50/20' : ''
        }`}
        draggable={!isCompleted && !isFailed}
        onDragStart={(e) => !isFailed && handleDragStart(e, task.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, task.id)}
        onDragEnd={handleDragEnd}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <Checkbox
                checked={statusForDate === 'completed'}
                onCheckedChange={(checked) => handleCheckboxChange(task.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                  {task.isEvent ? (
                    <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-purple-700 bg-purple-100 px-2 py-0.5 sm:py-1 rounded">
                      <CalendarDays className="h-3 w-3" />
                      {task.allDay ? 'All Day' : (
                        <>
                          {formatEventDateRange(task.startDate, task.endDate)}
                          {task.time && ` • ${task.time}`}
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 py-0.5 sm:py-1 rounded">
                      {task.time || 'No time'}
                    </span>
                  )}

                  {!isCompleted && (
                    <Badge variant="outline" className={`text-xs sm:text-sm ${getStatusColor(statusForDate)}`}>
                      {getStatusLabel(statusForDate)}
                    </Badge>
                  )}
                </div>

                <h3 className={`font-semibold text-base sm:text-lg mb-1 ${
                  statusForDate === 'completed' ? 'line-through text-muted-foreground' : 
                  statusForDate === 'failed' ? 'text-red-800' : ''
                } ${task.isEvent ? 'text-purple-800' : ''}`}>
                  {task.isEvent && '📅 '}
                  {task.title}
                </h3>

                {task.description && (
                  <div
                    className={`text-xs sm:text-sm ${
                      expandedDescriptions[task.id] ? '' : 'line-clamp-2'
                    } text-muted-foreground`}
                    onClick={() => toggleDescription(task.id)}
                  >
                    {task.description}
                    {task.description.length > 100 && (
                      <button
                        className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDescription(task.id);
                        }}
                      >
                        {expandedDescriptions[task.id] ? (
                          <ChevronUp className="h-4 w-4 inline" />
                        ) : (
                          <ChevronDown className="h-4 w-4 inline" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end sm:justify-normal gap-1 sm:gap-2 mt-2 sm:mt-0">
              {isFailed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRescheduleDialog(task)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 p-2"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Reschedule
                </Button>
              ) : !isCompleted && (
                <>
                  <Select
                    value={task.status}
                    onValueChange={(value: Task['status']) => {
                      onUpdateTask(task.id, { 
                        status: value,
                        ...(value !== 'failed' ? { failed: undefined } : {})
                      });
                    }}
                  >
                    <SelectTrigger className="w-24 sm:w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTask(task)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 p-2"
                  >
                    ✏️ Edit
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteTask(task.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 p-2"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            {taskToReschedule?.time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRescheduleSubmit}>
                Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {tasks.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📅</div>
          <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-1 sm:mb-2">
            No tasks scheduled
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Click "Add Task" to get started with your daily planning
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {activeTasks.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-base sm:text-lg text-gray-700 flex items-center gap-2">
                📋 Active Tasks ({activeTasks.length})
              </h3>
              {activeTasks.map((task) => renderTask(task, false, false))}
            </div>
          )}

          {failedTasks.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-base sm:text-lg text-red-700 flex items-center gap-2">
                ❌ Failed Tasks ({failedTasks.length})
              </h3>
              {failedTasks.map((task) => renderTask(task, false, true))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-base sm:text-lg text-green-700 flex items-center gap-2">
                ✅ Completed Tasks ({completedTasks.length})
              </h3>
              {completedTasks.map((task) => renderTask(task, true, false))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TaskList;