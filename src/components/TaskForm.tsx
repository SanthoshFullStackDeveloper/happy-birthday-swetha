import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Task } from '@/pages/Index';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'date' | 'userId'>) => void;
  onCancel: () => void;
  initialData?: Partial<Task>;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [time, setTime] = useState(initialData?.time || '09:00');
  const [status, setStatus] = useState<Task['status']>(initialData?.status || 'pending');

  const [isEvent, setIsEvent] = useState(initialData?.isEvent || false);
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [allDay, setAllDay] = useState(initialData?.allDay || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload: Omit<Task, 'id' | 'date' | 'userId'> = {
      title: title.trim(),
      description: description.trim(),
      time: allDay ? undefined : time,
      status,
      isEvent,
      startDate: isEvent ? startDate : undefined,
      endDate: isEvent ? endDate : undefined,
      allDay: isEvent ? allDay : undefined,
      perDayStatus: initialData?.perDayStatus || undefined
    };

    onSubmit(taskPayload);

    // Only reset form if not editing
    if (!initialData) {
      setTitle('');
      setDescription('');
      setTime('09:00');
      setStatus('pending');
      setIsEvent(false);
      setStartDate('');
      setEndDate('');
      setAllDay(false);
    }
  };

  const timeOptions = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Set default dates when isEvent changes
  React.useEffect(() => {
    if (isEvent && !startDate && !initialData?.startDate) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [isEvent, startDate, initialData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isEvent}
            onChange={() => setIsEvent((prev) => !prev)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          This is an event
        </label>
      </div>

      {isEvent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allDay}
                onChange={() => setAllDay((prev) => !prev)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              All Day Event
            </label>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="time">Time</Label>
        <Select 
          value={time} 
          onValueChange={setTime} 
          disabled={allDay}
          required={!allDay}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {timeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={status} 
          onValueChange={(value: Task['status']) => setStatus(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          {initialData ? 'Update' : 'Add'} {isEvent ? 'Event' : 'Task'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;