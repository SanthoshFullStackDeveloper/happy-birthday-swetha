import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Quote, CalendarDays, Heart, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import TaskAnimation from '@/components/TaskAnimation';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import {
  logOut,
  auth,
  setupTasksListener,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  updateUserProfileData,
  getUserProfileData,
} from '@/firebase';

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountSettings } from '@/components/AccountSettings';
import { updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";

interface UserProfile {
  id: string;
  uid: string;
  name: string;
  birthDate: Date | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  time?: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  isEvent?: boolean;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  perDayStatus?: {
    [date: string]: 'pending' | 'in-progress' | 'completed' | 'failed';
  };
  userId: string;
}

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskBeingEdited, setTaskBeingEdited] = useState<Task | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState<{ show: boolean; type: 'complete' | 'create' | 'edit' }>({ show: false, type: 'complete' });
  const [showWelcome, setShowWelcome] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthdaysToday, setBirthdaysToday] = useState<string[]>([]);

  // Calculate age based on birth date
  const calculateAge = (birthDate: Date, currentDate: Date): number => {
    const currentYear = currentDate.getFullYear();
    const birthYear = birthDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const birthMonth = birthDate.getMonth();
    const currentDay = currentDate.getDate();
    const birthDay = birthDate.getDate();

    let age = currentYear - birthYear;
    
    if (currentMonth < birthMonth || 
        (currentMonth === birthMonth && currentDay < birthDay)) {
      age--;
    }
    
    return age;
  };

  // Get the ordinal suffix for age (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Generate personalized birthday message based on age
  const getBirthdayMessage = (age: number, name: string): string => {
    const ageString = `${age}${getOrdinalSuffix(age)}`;
    
    const specialMessages: Record<number, string> = {
      1: `Happy 1st Birthday ${name}! 🎂👶 One year of amazing you!`,
      5: `Happy 5th Birthday ${name}! 🎉🎂 Five years of joy!`,
      10: `Happy ${ageString} Birthday ${name}! 🎂✨ Double digits now!`,
      13: `Happy ${ageString} Birthday ${name}! 🎉🔮 Welcome to teen years!`,
      16: `Happy Sweet 16 ${name}! 🎂💖 Enjoy your special day!`,
      18: `Happy ${ageString} Birthday ${name}! 🎉🎂 Welcome to adulthood!`,
      21: `Happy ${ageString} Birthday ${name}! 🎉 Cheers to your 21st!`,
      30: `Happy ${ageString} Birthday ${name}! 🎂✨ Welcome to your 30s!`,
      40: `Happy ${ageString} Birthday ${name}! 🎂 Like fine wine, you get better!`,
      50: `Happy ${ageString} Birthday ${name}! 🎉 Half a century young!`,
      60: `Happy ${ageString} Birthday ${name}! 🎂✨ Diamond jubilee celebration!`,
      100: `Happy Centennial Birthday ${name}! 🎉💯 A century of amazing you!`
    };

    return specialMessages[age] || `Happy ${ageString} Birthday ${name}! 🎉💖 May your day be amazing!`;
  };

  const fetchUserProfiles = async (): Promise<UserProfile[]> => {
    const userProfilesSnapshot = await getDocs(collection(db, 'userProfiles'));
    const profiles = await Promise.all(userProfilesSnapshot.docs.map(async (userProfileDoc) => {
      const userProfileData = userProfileDoc.data();
      const userDocRef = doc(db, 'users', userProfileDoc.id);
      const userDocSnap = await getDoc(userDocRef);

      let userName = 'Unnamed User';
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        userName = userData.name || userName;
      }

      return {
        id: userProfileDoc.id,
        uid: userProfileData.uid || userProfileDoc.id,
        name: userName,
        birthDate: userProfileData.birthDate?.toDate?.() || null,
      };
    }));

    return profiles;
  };

  const rescheduleTask = async (taskId: string, newDate: string, newTime?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updates: Record<string, any> = {
        date: newDate,
        status: 'pending',
      };

      if (newTime) {
        updates.time = newTime;
      }

      if ('failed' in task) {
        updates.failed = null;
      }

      await updateTaskInFirestore(taskId, updates, task.isEvent || false);
      toast({
        title: 'Task rescheduled!',
        description: 'The task has been moved to the new date',
      });
    } catch (error: any) {
      console.error('Error rescheduling task:', error);
      toast({
        title: 'Error rescheduling task',
        description: error.message || 'There was an error rescheduling your task',
        variant: 'destructive'
      });
    }
  };

  const checkTaskStatus = (task: Task, currentDate: Date): Task => {
    if (task.status === 'completed' || task.isEvent || !task.time) return task;

    const taskDateTime = new Date(`${task.date}T${task.time}`);
    
    if (taskDateTime < currentDate && task.status !== 'completed') {
      return {
        ...task,
        status: 'failed'
      };
    }
    
    return task;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const loadProfileData = async () => {
        try {
          const profileData = await getUserProfileData(user.uid);
          if (profileData) {
            if (profileData.birthDate) {
              setBirthDate(profileData.birthDate.toDate ? profileData.birthDate.toDate() : profileData.birthDate);
            }
            if (profileData.name) {
              setUserName(profileData.name);
            } else if (user.displayName) {
              setUserName(user.displayName);
            }
          } else {
            setUserName(user.displayName);
          }
        } catch (error) {
          console.error('Error loading profile data:', error);
          setUserName(user.displayName);
        }
      };

      loadProfileData();

      const unsubscribe = setupTasksListener(user.uid, (firebaseTasks) => {
        setTasks(firebaseTasks);
      });

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const profiles = await fetchUserProfiles();
        const matchedNames = profiles
          .filter(profile => {
            if (!profile.birthDate) return false;
            return (
              profile.birthDate.getDate() === selectedDate.getDate() &&
              profile.birthDate.getMonth() === selectedDate.getMonth()
            );
          })
          .map(profile => profile.name);

        setBirthdaysToday(matchedNames);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    };

    fetchBirthdays();
  }, [selectedDate]);

  const handleProfileUpdate = async (newName: string, newBirthDate?: Date | null) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateProfile(user, { displayName: newName });
      await updateUserProfileData(user.uid, { birthDate: newBirthDate || null });
      
      setUserName(newName);
      setBirthDate(newBirthDate || null);
      
      toast({
        title: 'Profile updated successfully!'
      });
      setShowAccountSettings(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        description: error.message || 'There was an error updating your profile',
        variant: 'destructive'
      });
    }
  };

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const tasksForSelectedDate = tasks
    .filter(task => {
      if (task.isEvent) {
        const start = task.startDate || '';
        const end = task.endDate || '';
        return selectedDateString >= start && selectedDateString <= end;
      } else {
        return task.date === selectedDateString;
      }
    })
    .map(task => checkTaskStatus(task, new Date()))
    .sort((a, b) => {
      if (a.isEvent && a.allDay) return -1;
      if (b.isEvent && b.allDay) return 1;
      return (a.time ?? '').localeCompare(b.time ?? '');
    });

  useEffect(() => {
    if (animationTrigger.show) {
      const timer = setTimeout(() => {
        setAnimationTrigger(prev => ({ ...prev, show: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [animationTrigger.show]);

  const triggerAnimation = (type: 'complete' | 'create' | 'edit') => {
    setAnimationTrigger({ show: true, type });
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'date' | 'userId'>) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please login to create tasks',
        variant: 'destructive'
      });
      return;
    }

    const cleanTaskData: any = {
      title: taskData.title,
      description: taskData.description || null,
      time: taskData.time || null,
      status: taskData.status || 'pending',
      isEvent: taskData.isEvent || false,
      userId: user.uid,
      date: selectedDateString
    };

    if (taskData.isEvent) {
      cleanTaskData.startDate = taskData.startDate || null;
      cleanTaskData.endDate = taskData.endDate || null;
      cleanTaskData.allDay = taskData.allDay || false;
    }

    Object.keys(cleanTaskData).forEach(key => {
      if (cleanTaskData[key] === undefined) {
        delete cleanTaskData[key];
      }
    });

    try {
      const taskId = await addTaskToFirestore(cleanTaskData);
      setShowTaskForm(false);
      triggerAnimation('create');

      toast({
        title: 'Task added successfully!',
        description: `${taskData.title} has been scheduled for ${format(selectedDate, 'MMM dd, yyyy')}`,
      });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error adding task',
        description: error.message || 'There was an error saving your task',
        variant: 'destructive'
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>, targetDate?: string) => {
    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return;

    const cleanUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    let updatedTask = { ...oldTask };

    if (oldTask.isEvent) {
      if (cleanUpdates.status && targetDate) {
        const perDayStatus = { ...(oldTask.perDayStatus || {}) };
        perDayStatus[targetDate] = cleanUpdates.status;

        updatedTask = {
          ...oldTask,
          perDayStatus,
          status: oldTask.status
        };
      } else {
        updatedTask = { ...oldTask, ...cleanUpdates };
      }
    } else {
      updatedTask = { ...oldTask, ...cleanUpdates };
    }

    try {
      await updateTaskInFirestore(updatedTask.id, cleanUpdates, updatedTask.isEvent || false);

      const oldStatus = oldTask.isEvent
        ? oldTask.perDayStatus?.[selectedDateString] || oldTask.status
        : oldTask.status;

      const newStatus = oldTask.isEvent
        ? updatedTask.perDayStatus?.[selectedDateString] || updatedTask.status
        : updatedTask.status;

      const isNewlyCompleted = newStatus === 'completed' && oldStatus !== 'completed';

      if (isNewlyCompleted) {
        triggerAnimation('complete');
      } else {
        triggerAnimation('edit');
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error updating task',
        description: error.message || 'There was an error updating your task',
        variant: 'destructive'
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await deleteTaskFromFirestore(taskId, task.isEvent || false);
      toast({
        title: 'Task deleted',
        description: task ? `${task.title} has been removed` : 'Task removed',
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        description: error.message || 'There was an error deleting your task',
        variant: 'destructive'
      });
    }
  };

  const reorderTasks = (reorderedTasks: Task[]) => {
    const otherTasks = tasks.filter(task => task.date !== selectedDateString);
    setTasks([...otherTasks, ...reorderedTasks]);
    triggerAnimation('edit');
  };

  const getTaskStats = () => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let failed = 0;

    tasksForSelectedDate.forEach(task => {
      const status = task.isEvent
        ? task.perDayStatus?.[selectedDateString] || task.status
        : task.status;
      if (status === 'completed') completed++;
      else if (status === 'in-progress') inProgress++;
      else if (status === 'failed') failed++;
      else pending++;
    });

    return { completed, inProgress, pending, failed, total: tasksForSelectedDate.length };
  };

  const stats = getTaskStats();

  const handleEditTask = (task: Task) => {
    setTaskBeingEdited(task);
    setShowTaskForm(true);
  };

  const handleFormSubmit = (taskData: Omit<Task, 'id' | 'date' | 'userId'>) => {
    if (taskBeingEdited) {
      updateTask(taskBeingEdited.id, taskData);
      toast({
        title: 'Task updated successfully!',
        description: `${taskData.title} has been updated.`,
      });
    } else {
      addTask(taskData);
    }
    setTaskBeingEdited(null);
    setShowTaskForm(false);
  };

  const handleFormCancel = () => {
    setTaskBeingEdited(null);
    setShowTaskForm(false);
  };

  if (showWelcome) {
    return <WelcomeAnimation onComplete={() => setShowWelcome(false)} />;
  }

  const userEmail = auth.currentUser?.email || '';
  const isUsersBirthday = birthDate &&
    selectedDate.getDate() === birthDate.getDate() &&
    selectedDate.getMonth() === birthDate.getMonth();
  
  const userAge = isUsersBirthday ? calculateAge(birthDate, selectedDate) : 0;
  const isSistersBirthday = selectedDate.getDate() === 18 && selectedDate.getMonth() === 6;
  const sisterAge = isSistersBirthday ? calculateAge(new Date(2006, 6, 18), selectedDate) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="flex justify-end gap-2 p-4">
        <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-purple-600 hover:bg-purple-100/50">
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Account Settings</DialogTitle>
            </DialogHeader>
            <AccountSettings
              userName={userName || ''}
              birthDate={birthDate}
              onClose={() => setShowAccountSettings(false)}
              onUpdate={handleProfileUpdate}
            />
          </DialogContent>
        </Dialog>
        <Button
          onClick={async () => {
            await logOut();
            toast({
              title: 'Logged out',
              description: 'You have been logged out successfully',
            });
          }}
          variant="ghost"
          className="text-purple-600 hover:bg-purple-100/50"
        >
          Logout
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {userName ? `${userName}'s Daily Task Scheduler` : 'Your Daily Task Scheduler'}
            </h1>
            <p className="text-lg text-muted-foreground">
              Organize your day with style and efficiency
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-6">
            <Card className="backdrop-blur-sm bg-gradient-to-r from-purple-100/50 to-blue-100/50 border-purple-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  {isUsersBirthday ? (
                    <>
                      <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 animate-bounce" />
                      <blockquote className="text-lg font-medium text-pink-700 italic text-center">
                        {getBirthdayMessage(userAge, userName || '')}
                      </blockquote>
                      <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 animate-bounce" />
                    </>
                  ) : userEmail === 'princess@birthday.com' && birthdaysToday.length > 0 ? (
                    <>
                      <Heart className="h-6 w-6 text-green-500 flex-shrink-0 animate-ping" />
                      <blockquote className="text-lg font-medium text-green-700 italic text-center">
                        {birthdaysToday.map(name => (
                          <div key={name}>🎉 Happy Birthday {name}! 💖</div>
                        ))}
                      </blockquote>
                      <Heart className="h-6 w-6 text-green-500 flex-shrink-0 animate-ping" />
                    </>
                  ) : isSistersBirthday && userEmail === 'princess@birthday.com' ? (
                    <>
                      <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 animate-bounce" />
                      <blockquote className="text-lg font-medium text-pink-700 italic text-center">
                        {getBirthdayMessage(sisterAge, 'Sister')}
                      </blockquote>
                      <Heart className="h-6 w-6 text-pink-500 flex-shrink-0 animate-bounce" />
                    </>
                  ) : isSistersBirthday ? (
                    <>
                      <Heart className="h-6 w-6 text-purple-600 flex-shrink-0 animate-pulse" />
                      <blockquote className="text-lg font-medium text-purple-700 italic text-center">
                        {`It's Swetha's ${sisterAge}${getOrdinalSuffix(sisterAge)} birthday today! 🎂`}
                      </blockquote>
                      <Heart className="h-6 w-6 text-purple-600 flex-shrink-0 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <Quote className="h-6 w-6 text-purple-600 flex-shrink-0" />
                      <blockquote className="text-lg font-medium text-gray-700 italic text-center">
                        "Success is the sum of small efforts repeated day in and day out."
                      </blockquote>
                      <Quote className="h-6 w-6 text-purple-600 flex-shrink-0 rotate-180" />
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {isUsersBirthday
                    ? 'Have a wonderful day! 🎂'
                    : isSistersBirthday && userEmail === 'princess@birthday.com'
                    ? '- From your loving sibling 💝'
                    : isSistersBirthday
                    ? '- From her loving sibling 💝'
                    : '- Robert Collier'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 border-purple-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <CalendarDays className="h-5 w-5" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border-0"
                />
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Today's Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                      <div className="text-xs text-green-600">Completed</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
                      <div className="text-xs text-blue-600">In Progress</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
                      <div className="text-xs text-red-600">Failed</div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-indigo-700">{stats.total}</div>
                    <div className="text-xs text-indigo-600">Total Tasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="backdrop-blur-sm bg-white/80 border-blue-200 shadow-lg sm:shadow-xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 pb-3 sm:pb-4 px-4 sm:px-6">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-blue-700">
                    Tasks for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stats.total} tasks scheduled
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setTaskBeingEdited(null);
                    setShowTaskForm(true);
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                {showTaskForm && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <TaskForm
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                      initialData={taskBeingEdited || undefined}
                    />
                  </div>
                )}
                <TaskList
                  tasks={tasksForSelectedDate}
                  selectedDate={selectedDateString}
                  onUpdateTask={(taskId, updates) => updateTask(taskId, updates, selectedDateString)}
                  onDeleteTask={deleteTask}
                  onReorderTasks={reorderTasks}
                  onEditTask={handleEditTask}
                  onRescheduleTask={rescheduleTask}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TaskAnimation
        key={animationTrigger.show ? Date.now() : 'none'}
        type={animationTrigger.type}
        trigger={animationTrigger.show}
        onComplete={() => setAnimationTrigger({ show: false, type: 'complete' })}
      />
    </div>
  );
};

export default Index;