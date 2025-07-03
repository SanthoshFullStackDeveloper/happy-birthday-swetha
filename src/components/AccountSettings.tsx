import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AccountSettingsProps {
  userName: string;
  birthDate?: Date | null;
  onClose: () => void;
  onUpdate: (newName: string, newBirthDate?: Date | null) => Promise<void>;
}

export const AccountSettings = ({
  userName,
  birthDate,
  onClose,
  onUpdate
}: AccountSettingsProps) => {
  const [name, setName] = useState(userName);
  const [date, setDate] = useState<Date | undefined>(birthDate || undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [year, setYear] = useState<number>(date?.getFullYear() || new Date().getFullYear());
  const [visibleMonth, setVisibleMonth] = useState<Date>(date || new Date(year, 0, 1));

  // Generate years from 1900 to current year
  const years = Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i).reverse();

  const handleYearChange = (selectedYear: string) => {
    const newYear = parseInt(selectedYear, 10);
    setYear(newYear);

    if (date) {
      const newDate = new Date(date);
      newDate.setFullYear(newYear);
      setDate(newDate);
      setVisibleMonth(newDate);
    } else {
      const newMonth = new Date(newYear, 0, 1);
      setVisibleMonth(newMonth);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(name, date);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Birth Date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full mt-1 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 fixed z-50"
          >
            <div className="flex flex-col gap-2 p-2">
              <div className="relative px-2">
                <Select value={year.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-auto">
                    {years.map((yearOption) => (
                      <SelectItem key={yearOption} value={yearOption.toString()}>
                        {yearOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  onMonthChange={setVisibleMonth} // <-- Add this line
  initialFocus
  month={visibleMonth}
  className="rounded-md border"
  fromYear={1900}
  toYear={new Date().getFullYear()}
/>

            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
