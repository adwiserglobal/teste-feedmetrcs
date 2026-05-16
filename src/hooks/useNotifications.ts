import { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export interface Notification {
  id: string;
  type: 'new_feedback' | 'form_response' | 'new_insight' | 'account';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.accountId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('account_id', '==', user.accountId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Notification[] = [];
      let unread = 0;
      snapshot.forEach(doc => {
        const notif = { id: doc.id, ...doc.data() } as Notification;
        data.push(notif);
        if (!notif.read) unread++;
      });
      
      setNotifications(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.accountId]);

  const markAsRead = async (id: string) => {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.accountId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('account_id', '==', user.accountId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((d) => {
        batch.update(doc(db, 'notifications', d.id), { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: () => {}
  };
}