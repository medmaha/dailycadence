import { useState, useEffect } from "react";

import { Button, Dialog, Eyebrow } from "@/components/ui-kit";
import {
  requestNotificationPermission
} from "@/lib/push-notification";
import {
  addReminder,
  deleteReminder,
  updateReminder,
  getReminders,
  type Reminder,
} from "@/lib/reminders";
import {
  getRingtones,
  playRingtone,
  type Ringtone,
} from "@/lib/ringtones";
import { PlayIcon } from "lucide-react";
import { useRingtoneStore } from "@/stores/ringtoneStore";
import { usePushNotificationStore } from "@/stores/notificationStore";
import { useReminderStore } from "@/stores/reminderStore";

const DAYS = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

export function ReminderSettings() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const soundEnabled = useRingtoneStore(s => s.soundEnabled)

  const ringtones = useRingtoneStore(s => s.ringtones)
  const reminders = useReminderStore(s => s.reminders)
  const setRingtones = useRingtoneStore(s => s.setRingtones)
  const setReminders = useReminderStore(s => s.setReminders)

  // Form state
  const [time, setTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [message, setMessage] = useState("Time for your daily workout!");
  const [selectedRingtoneId, setSelectedRingtoneId] = useState<string>("default");

  useEffect(() => {
    setReminders(getReminders());
    setRingtones(getRingtones());
    setNotificationEnabled(usePushNotificationStore.getState().isNotificationsEnabled());

    // trigger sound check and sets state
    usePushNotificationStore.getState().isNotificationsEnabled()
  }, []);

  useEffect(() => {
    if (showAddForm) {
      setReminders(getReminders());
    }
  }, [showAddForm, setReminders]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  const handleAddReminder = () => {
    if (!notificationEnabled) {
      handleRequestPermission();
      return;
    }

    const newReminder = addReminder({
      time,
      days: selectedDays,
      enabled: true,
      message,
      ringtoneId: selectedRingtoneId,
    });

    setReminders([...reminders, newReminder]);
    setShowAddForm(false);
    resetForm();
  };

  const handleUpdateReminder = () => {
    if (!editingReminder) return;

    updateReminder(editingReminder.id, {
      time,
      days: selectedDays,
      message,
      ringtoneId: selectedRingtoneId,
    });

    setReminders(
      reminders.map((r) =>
        r.id === editingReminder.id
          ? { ...r, time, days: selectedDays, message, ringtoneId: selectedRingtoneId }
          : r
      )
    );
    setEditingReminder(null);
    resetForm();
    setShowAddForm(false);
  };

  const handleDeleteReminder = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteReminder(id);
      setReminders(reminders.filter((r) => r.id !== id));
    }
  };

  const handleToggleReminder = (id: string, enabled: boolean) => {
    updateReminder(id, { enabled });
    setReminders(
      reminders.map((r) => (r.id === id ? { ...r, enabled } : r))
    );
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setTime(reminder.time);
    setSelectedDays(reminder.days);
    setMessage(reminder.message);
    setSelectedRingtoneId(reminder.ringtoneId || "default");
    setShowAddForm(true);
  };

  const resetForm = () => {
    setTime("09:00");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setMessage("Time for your daily workout!");
    setSelectedRingtoneId("default");
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  };

  return (
    <>

      <div className="space-y-6">
        <div>
          <Eyebrow>Notifications</Eyebrow>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {notificationEnabled
                ? "Notifications enabled"
                : "Enable notifications to receive workout reminders"}
            </p>
            {!notificationEnabled && (
              <Button size="md" onClick={handleRequestPermission}>
                Enable
              </Button>
            )}
          </div>
        </div>

        {notificationEnabled && (
          <div>
            <Eyebrow>Sound</Eyebrow>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Play sound with notifications
              </p>
              <button
                onClick={() => useRingtoneStore.getState().setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? "bg-primary" : "bg-surface-2"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>
        )}

        {notificationEnabled && (
          <>
            <div>
              <Eyebrow>Reminders</Eyebrow>
              <div className="mt-3 space-y-3">
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reminders set. Add one to get daily workout notifications.
                  </p>
                ) : (
                  reminders.map((reminder) => (
                    <ReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={(enabled) => handleToggleReminder(reminder.id, enabled)}
                      onEdit={() => handleEditReminder(reminder)}
                      onDelete={() => handleDeleteReminder(reminder.id)}
                    />
                  ))
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditingReminder(null);
              }}
            >
              Add reminder
            </Button>

          </>
        )}

      </div>
      {showAddForm &&
        <Dialog isOpen className="bg-card text-card-foreground px-2" onClose={() => setShowAddForm(false)} title={editingReminder ? "Edit reminder" : "New reminder"}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-surface p-3 font-display text-lg outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${selectedDays.includes(day.id)
                      ? "border-primary bg-primary/12 text-primary"
                      : "border-border-strong text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Time for your daily workout!"
                className="w-full rounded-xl border border-input bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Ringtone
              </label>
              <div className="space-y-2">
                {ringtones.map((ringtone) => (
                  <div
                    key={ringtone.id}
                    className={`flex items-center justify-between rounded-lg border p-2 cursor-pointer transition-colors ${selectedRingtoneId === ringtone.id
                      ? "border-primary bg-primary/12"
                      : "border-border bg-surface hover:border-border-strong"
                      }`}
                    onClick={() => setSelectedRingtoneId(ringtone.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${selectedRingtoneId === ringtone.id
                          ? "border-primary bg-primary"
                          : "border-border"
                          }`}
                      />
                      <span className="text-sm capitalize text-foreground/60">{ringtone.name}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="icon"
                      className="bg-primary/10 border border-primary/50 w-7 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        playRingtone(ringtone.id);
                      }}
                    >
                      <PlayIcon className="w-4 h-4 text-white fill-white" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingReminder(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={editingReminder ? handleUpdateReminder : handleAddReminder}>
                {editingReminder ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </Dialog>
      }
    </>
  );
}

function ReminderItem({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dayLabels = reminder.days
    .map((d) => DAYS.find((day) => day.id === d)?.label)
    .filter(Boolean)
    .join(", ");

  const ringtones = getRingtones();
  const ringtone = ringtones.find(r => r.id === reminder.ringtoneId) || ringtones[0];

  return (
    <div className="flex items-start justify-between rounded-xl border border-border bg-surface p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-lg">{reminder.time}</p>
          <button
            onClick={() => onToggle(!reminder.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reminder.enabled ? "bg-primary" : "bg-surface-2"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reminder.enabled ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{dayLabels}</p>
        <p className="mt-1 text-sm">{reminder.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">Ringtone: {ringtone?.name}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="md" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="md" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
