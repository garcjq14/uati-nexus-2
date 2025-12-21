import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, Trophy, CheckCircle2, X, ArrowRight, Play } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons: Record<string, any> = {
  review_due: Clock,
  deadline_approaching: Clock,
  achievement: Trophy,
  default: Bell,
};

const notificationColors: Record<string, string> = {
  review_due: 'text-yellow-400',
  deadline_approaching: 'text-primary',
  achievement: 'text-green-400',
  default: 'text-primary',
};

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?unread=true');
      setNotifications(response.data.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const handleQuickAction = (notification: Notification, action: string) => {
    markAsRead(notification.id);
    if (action === 'review' && notification.type === 'review_due') {
      navigate('/spaced-repetition');
      onClose();
    } else if (action === 'view' && notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff} min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="fixed z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-96 max-h-[calc(100vh-8rem)] sm:max-h-[600px] overflow-hidden"
        style={{
          top: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))',
          right: 'max(1rem, env(safe-area-inset-right))',
          left: 'max(1rem, env(safe-area-inset-left))',
        }}
      >
        <Card className="border-white/10 bg-background/95 backdrop-blur-md shadow-xl">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors touch-manipulation flex-shrink-0"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Fechar notificações"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhuma notificação não lida
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification, index) => {
                    const Icon =
                      notificationIcons[notification.type] || notificationIcons.default;
                    const color =
                      notificationColors[notification.type] || notificationColors.default;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          className={cn(
                            'w-full flex items-start gap-3 p-4 hover:bg-white/5 transition-colors',
                            'border-b border-white/5 last:border-0',
                            !notification.read && 'bg-primary/5'
                          )}
                        >
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex items-start gap-3 flex-1 text-left min-w-0"
                          >
                            <div className={cn('rounded-full bg-white/5 p-2 flex-shrink-0', color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </button>
                          {/* Quick Actions */}
                          {notification.type === 'review_due' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(notification, 'review');
                              }}
                              className="flex-shrink-0 h-8 text-xs"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Revisar
                            </Button>
                          )}
                          {notification.link && notification.type !== 'review_due' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAction(notification, 'view');
                              }}
                              className="flex-shrink-0 h-8 text-xs"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-white/5">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate('/notifications');
                    onClose();
                  }}
                >
                  Ver todas as notificações
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

