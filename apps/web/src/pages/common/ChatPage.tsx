import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ChatRoom, ChatMessage, User } from '@agencyos/shared';
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Search,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Info,
  X,
  AlertTriangle,
  Eye,
} from 'lucide-react';

const EMOJI_OPTIONS = ['🏢', '🔥', '🎯', '🚀', '💬', '💡', '💰', '⚡', '💎', '📈'];
const QUICK_REACTIONS = ['🔥', '🚀', '💰', '🎉', '👍', '👏', '🤝', '🎯'];

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const { markAsRead } = useChatStore();
  const queryClient = useQueryClient();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteRoomConfirm, setShowDeleteRoomConfirm] = useState(false);
  const [selectedMessageForInfo, setSelectedMessageForInfo] = useState<ChatMessage | null>(null);

  // Real-time typing indicators state
  const [typingUsers, setTypingUsers] = useState<Record<string, { userName: string; timestamp: number }>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear unread notification badge whenever ChatPage is mounted
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Clean up stale typing indicators older than 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, data] of Object.entries(next)) {
          if (now - data.timestamp > 3500) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Clear typers on active room switch
  useEffect(() => {
    setTypingUsers({});
  }, [activeRoomId]);

  // New Group Form state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('💬');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Rooms
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<ChatRoom[]>({
    queryKey: ['chat-rooms'],
    queryFn: () => api.get('/chat/rooms'),
  });

  // Set default active room once loaded
  useEffect(() => {
    if (rooms.length > 0 && !activeRoomId) {
      setActiveRoomId(rooms[0]._id);
    }
  }, [rooms, activeRoomId]);

  // 2. Fetch Team Users for Group Creation
  const { data: teamUsers = [] } = useQuery<User[]>({
    queryKey: ['team-users-for-chat'],
    queryFn: () => api.get('/team'),
    enabled: showCreateModal,
  });

  // 3. Fetch Messages for Active Room
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', activeRoomId],
    queryFn: () => (activeRoomId ? api.get(`/chat/rooms/${activeRoomId}/messages`) : []),
    enabled: !!activeRoomId,
    refetchInterval: 3000, // Poll fallback for guaranteed sync
  });

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Mark active room messages as read when activeRoomId changes or messages arrive
  useEffect(() => {
    if (activeRoomId) {
      api.post(`/chat/rooms/${activeRoomId}/read`).catch(() => {});
    }
  }, [activeRoomId]);

  // 5. Socket.IO Real-Time Listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload: { roomId: string; message: ChatMessage }) => {
      // If message is for currently active room, update cache
      if (payload.roomId === activeRoomId) {
        queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => {
          // If a temporary optimistic message exists with matching content from this user, replace it
          const existingTempIndex = old.findIndex(
            (m) => m._id.startsWith('temp-') && m.senderId === payload.message.senderId && m.message === payload.message.message
          );

          if (existingTempIndex !== -1) {
            const updated = [...old];
            updated[existingTempIndex] = payload.message;
            return updated;
          }

          if (old.some((m) => m._id === payload.message._id)) return old;
          return [...old, payload.message];
        });

        // If message is from someone else, automatically mark as read since we are viewing this room
        if (payload.message.senderId !== user?._id) {
          api.post(`/chat/rooms/${activeRoomId}/read`).catch(() => {});
        }
      }
      // Also invalidate rooms list so lastMessage updates
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };

    const handleMessagesRead = (payload: {
      roomId: string;
      userId: string;
      userName: string;
      readAt: string;
    }) => {
      if (payload.roomId === activeRoomId) {
        queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => {
          return old.map((m) => {
            const alreadyRead = m.readBy?.some((r) => r.userId === payload.userId);
            if (alreadyRead) return m;
            return {
              ...m,
              readBy: [
                ...(m.readBy || []),
                {
                  userId: payload.userId,
                  name: payload.userName,
                  readAt: payload.readAt,
                },
              ],
            };
          });
        });
      }
    };

    const handleRoomCreated = (newRoom: ChatRoom) => {
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old = []) => {
        if (old.some((r) => r._id === newRoom._id)) return old;
        return [newRoom, ...old];
      });
    };

    const handleRoomDeleted = (payload: { roomId: string }) => {
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old = []) =>
        old.filter((r) => r._id !== payload.roomId)
      );
      if (activeRoomId === payload.roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        setActiveRoomId(null);
      }
    };

    const handleUserTyping = (payload: {
      roomId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (payload.roomId !== activeRoomId || payload.userId === user?._id) return;

      setTypingUsers((prev) => {
        const next = { ...prev };
        if (payload.isTyping) {
          next[payload.userId] = { userName: payload.userName, timestamp: Date.now() };
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:messages_read', handleMessagesRead);
    socket.on('chat:room_created', handleRoomCreated);
    socket.on('chat:room_deleted', handleRoomDeleted);
    socket.on('chat:user_typing', handleUserTyping);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:messages_read', handleMessagesRead);
      socket.off('chat:room_created', handleRoomCreated);
      socket.off('chat:room_deleted', handleRoomDeleted);
      socket.off('chat:user_typing', handleUserTyping);
    };
  }, [activeRoomId, queryClient, user?._id]);

  // 6. Send Message Mutation (Optimistic WhatsApp-Style)
  const sendMutation = useMutation({
    mutationFn: ({ message, tempId }: { message: string; tempId: string }) =>
      api.post(`/chat/rooms/${activeRoomId}/messages`, { message }),
    onSuccess: (newMsg, variables) => {
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => {
        return old.map((m) => (m._id === variables.tempId ? newMsg : m));
      });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (_err, variables) => {
      // Mark or keep message
      console.error('Failed to send message:', variables.tempId);
    },
  });

  // 7. Instant Optimistic Send Handler (0s lag feel)
  const sendOptimisticMessage = (textToSend: string) => {
    if (!textToSend.trim() || !activeRoomId) return;

    const trimmed = textToSend.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      _id: tempId,
      organizationId: user?.organizationId || '',
      roomId: activeRoomId,
      senderId: user?._id || '',
      senderName: user?.name || 'You',
      senderRole: user?.role || 'SALES_REP',
      message: trimmed,
      sentAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      readBy: [
        {
          userId: user?._id || '',
          name: user?.name || 'You',
          readAt: nowIso,
        },
      ],
    };

    // Instantly append to query cache
    queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => [
      ...old,
      optimisticMsg,
    ]);

    // Instant smooth scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 10);

    // Background sync with server
    sendMutation.mutate({ message: trimmed, tempId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);

    const socket = getSocket();
    if (!socket || !activeRoomId || !user) return;

    socket.emit('chat:typing', {
      roomId: activeRoomId,
      userName: user.name,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', {
        roomId: activeRoomId,
        userName: user.name,
        isTyping: false,
      });
    }, 2500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeRoomId) return;

    // Immediately stop typing indicator for this user
    const socket = getSocket();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket && activeRoomId && user) {
      socket.emit('chat:typing', {
        roomId: activeRoomId,
        userName: user.name,
        isTyping: false,
      });
    }

    const text = messageText;
    setMessageText(''); // Clear input instantly!
    sendOptimisticMessage(text);
  };

  // 8. Create Group Room Mutation
  const createRoomMutation = useMutation({
    mutationFn: (payload: any) => api.post('/chat/rooms', payload),
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      setShowCreateModal(false);
      setGroupName('');
      setGroupDesc('');
      setSelectedMemberIds([]);
      setActiveRoomId(newRoom._id);
    },
  });

  // 9. Delete Group Room Mutation (Super Admin Only)
  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => api.delete(`/chat/rooms/${roomId}`),
    onSuccess: (_, deletedRoomId) => {
      setShowDeleteRoomConfirm(false);
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old = []) =>
        old.filter((r) => r._id !== deletedRoomId)
      );
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      const remaining = rooms.filter((r) => r._id !== deletedRoomId);
      setActiveRoomId(remaining.length > 0 ? remaining[0]._id : null);
    },
  });

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    createRoomMutation.mutate({
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatar,
      memberUserIds: selectedMemberIds,
      isGroup: true,
    });
  };

  const activeRoom = rooms.find((r) => r._id === activeRoomId);

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.lastMessage?.text || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-6.5rem)] flex bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden min-w-0 max-w-full">
      {/* LEFT SIDEBAR: Channels & Conversations */}
      <div className="w-80 sm:w-96 border-r border-[#E5E7EB] flex flex-col bg-[#FAFBFD] shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#991B1B] to-[#7F1D1D] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-bold text-xs text-slate-900 tracking-tight">Team Live Chat</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Socket Connected</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-lg shadow-sm transition-all cursor-pointer"
            title="Create New Group Channel"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#E5E7EB] bg-white/70">
          <div className="relative">
            <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels & chats..."
              className="w-full bg-[#F5F6F8] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#991B1B]"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {isLoadingRooms ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading channels...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No channels found</div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = room._id === activeRoomId;
              return (
                <button
                  key={room._id}
                  onClick={() => setActiveRoomId(room._id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-red-50/70 border border-red-200/80 shadow-2xs'
                      : 'hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                    {room.avatar || '💬'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-[#991B1B]' : 'text-slate-900'
                        }`}
                      >
                        {room.name}
                      </span>
                      {room.lastMessage?.sentAt && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {new Date(room.lastMessage.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {room.lastMessage?.senderName && (
                        <span className="font-semibold text-slate-700">
                          {room.lastMessage.senderName}:{' '}
                        </span>
                      )}
                      {room.lastMessage?.text || 'No messages yet. Say hello!'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Current User Pill */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            Online
          </span>
        </div>
      </div>

      {/* RIGHT PANE: Chat Messages Stream */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6F8]">
        {activeRoom ? (
          <>
            {/* Chat Room Header */}
            <div className="h-16 px-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200/60 flex items-center justify-center text-xl shrink-0">
                  {activeRoom.avatar || '💬'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {activeRoom.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200 shrink-0">
                      {activeRoom.members?.length || 1} members
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {activeRoom.description || 'Live group chat channel for fast team decisions'}
                  </p>
                </div>
              </div>

              {/* Right Controls: Members Preview & Super Admin Delete Action */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center -space-x-2">
                  {activeRoom.members?.slice(0, 4).map((m, idx) => (
                    <div
                      key={idx}
                      title={`${m.name} (${m.role})`}
                      className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold border-2 border-white flex items-center justify-center"
                    >
                      {m.name?.[0] || 'U'}
                    </div>
                  ))}
                </div>

                {/* Delete Channel Button - Visible ONLY to Super Admin */}
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowDeleteRoomConfirm(true)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-200"
                    title="Delete Group Channel (Admin Only)"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#991B1B] flex items-center justify-center text-2xl mb-2">
                    💬
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">No messages in this channel yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Start the discussion! Send updates, pitch questions, or close client deals together.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?._id;
                  const isSuperAdminSender = msg.senderRole === 'SUPER_ADMIN';
                  const isPending = msg._id.startsWith('temp-');

                  // Seen-by calculations: readers other than the sender
                  const readersOtherThanSender = (msg.readBy || []).filter(
                    (r) => r.userId !== msg.senderId
                  );
                  const isReadByOthers = readersOtherThanSender.length > 0;

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-3 max-w-xl ${
                        isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${
                          isMe
                            ? 'bg-[#991B1B]'
                            : isSuperAdminSender
                            ? 'bg-slate-900 border border-red-500/50'
                            : 'bg-slate-700'
                        }`}
                      >
                        {msg.senderName?.[0] || 'U'}
                      </div>

                      {/* Bubble */}
                      <div className={`space-y-1 ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[11px] font-bold text-slate-800">
                            {isMe ? 'You' : msg.senderName}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                              isSuperAdminSender
                                ? 'bg-red-100 text-[#991B1B]'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSuperAdminSender ? 'Admin' : 'Sales'}
                          </span>
                        </div>

                        {/* WhatsApp-Style Bubble with Integrated Timestamp and Double Ticks */}
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs relative group ${
                            isMe
                              ? 'bg-[#991B1B] text-white rounded-tr-none'
                              : 'bg-white border border-[#E5E7EB] text-slate-900 rounded-tl-none'
                          }`}
                        >
                          <div className="pr-1">{msg.message}</div>

                          {/* Footer Info: Sent time + WhatsApp Status Ticks */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                              isMe ? 'text-white/80' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Status Ticks for Sent Messages */}
                            {isMe && (
                              <button
                                type="button"
                                onClick={() => setSelectedMessageForInfo(msg)}
                                className="inline-flex items-center cursor-pointer hover:scale-110 transition-transform"
                                title={
                                  isPending
                                    ? 'Sending...'
                                    : isReadByOthers
                                    ? `Read by ${readersOtherThanSender.length} team members (Click to view)`
                                    : 'Delivered to server (Click to view)'
                                }
                              >
                                {isPending ? (
                                  <Clock size={11} className="text-white/70 animate-pulse ml-0.5" />
                                ) : isReadByOthers ? (
                                  /* Double Blue / Cyan Ticks (Read / Seen) */
                                  <CheckCheck size={14} className="text-cyan-300 stroke-[2.5] ml-0.5" />
                                ) : (
                                  /* Double White Ticks (Delivered to Server) */
                                  <CheckCheck size={14} className="text-white/60 stroke-[2] ml-0.5" />
                                )}
                              </button>
                            )}

                            {/* Message Info button on hover for incoming messages */}
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => setSelectedMessageForInfo(msg)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-slate-700"
                                title="Message info & read receipts"
                              >
                                <Info size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Reactions Bar */}
            <div className="px-6 py-2 bg-white/60 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">
                Quick React:
              </span>
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendOptimisticMessage(emoji)}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-100 hover:scale-110 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Real-time Typing Indicator ("Sagar is typing...") */}
            {Object.values(typingUsers).length > 0 && (
              <div className="px-6 py-2 bg-[#FAF9F5] border-t border-cream-300 flex items-center gap-2 text-xs text-charcoal-700 animate-fadeIn transition-all">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B] animate-bounce" />
                </div>
                <span className="font-bold text-charcoal-900">
                  {Object.values(typingUsers).map((t) => t.userName).join(', ')}
                </span>
                <span className="text-charcoal-500 font-medium italic">
                  {Object.values(typingUsers).length === 1 ? 'is typing...' : 'are typing...'}
                </span>
              </div>
            )}

            {/* Input Composer Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                value={messageText}
                onChange={handleInputChange}
                placeholder={`Message #${activeRoom.name}... (Press Enter to send instantly)`}
                className="flex-1 bg-[#F5F6F8] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#991B1B]"
              />

              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-4 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-red-900/20 transition-all cursor-pointer shrink-0"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Select a channel or create a new group to start messaging
          </div>
        )}
      </div>

      {/* MESSAGE INFO / READ RECEIPTS MODAL (WhatsApp Style "Message Info") */}
      {selectedMessageForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-cyan-400" />
                <h3 className="font-bold text-sm">Message Info & Read Receipts</h3>
              </div>
              <button
                onClick={() => setSelectedMessageForInfo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Message Preview Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700">
                    {selectedMessageForInfo.senderName}
                  </span>
                  <span>
                    {new Date(selectedMessageForInfo.sentAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <p className="text-slate-900 font-medium text-xs leading-relaxed">
                  {selectedMessageForInfo.message}
                </p>
              </div>

              {/* Read By List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <CheckCheck size={15} className="text-cyan-500 stroke-[2.5]" />
                    <span>Read by</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full">
                    {(selectedMessageForInfo.readBy || []).filter(
                      (r) => r.userId !== selectedMessageForInfo.senderId
                    ).length}{' '}
                    members
                  </span>
                </div>

                {(() => {
                  const readers = (selectedMessageForInfo.readBy || []).filter(
                    (r) => r.userId !== selectedMessageForInfo.senderId
                  );

                  if (readers.length === 0) {
                    return (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                        Delivered to server. Not yet read by other team members.
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                      {readers.map((reader, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                              {reader.name?.[0] || 'U'}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800 text-xs">
                                {reader.name}
                              </span>
                              <span className="block text-[10px] text-cyan-600 font-medium">
                                Seen / Read
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(reader.readAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Delivery Status */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCheck size={14} className="text-slate-400 stroke-2" />
                  <span>Delivered at</span>
                </div>
                <span>
                  {new Date(selectedMessageForInfo.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMessageForInfo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE GROUP CHANNEL CONFIRMATION MODAL (Super Admin Only) */}
      {showDeleteRoomConfirm && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">
                  Delete #{activeRoom.name}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete this group channel? All messages and
                  chat history will be removed for all team members. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteRoomConfirm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteRoomMutation.isPending}
                  onClick={() => deleteRoomMutation.mutate(activeRoom._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>{deleteRoomMutation.isPending ? 'Deleting...' : 'Delete Channel'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Create New Group Channel</h3>
                <p className="text-[11px] text-slate-400">
                  Connect sales reps and admin for instant live collaboration
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Group Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. High-Ticket Closers or E-Commerce Squad"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Channel Emoji Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setGroupAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-all cursor-pointer ${
                        groupAvatar === emoji
                          ? 'border-[#991B1B] bg-red-50 scale-110 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Channel Purpose / Description
                </label>
                <textarea
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Brief description of channel goals..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Team Members to Add
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {teamUsers.map((member) => {
                    const isChecked = selectedMemberIds.includes(member._id);
                    return (
                      <label
                        key={member._id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-red-50/70 border-red-300 text-[#991B1B] font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMemberIds([...selectedMemberIds, member._id]);
                              } else {
                                setSelectedMemberIds(
                                  selectedMemberIds.filter((id) => id !== member._id)
                                );
                              }
                            }}
                            className="rounded text-[#991B1B] focus:ring-0"
                          />
                          <div>
                            <span className="block font-medium">{member.name}</span>
                            <span className="block text-[10px] text-slate-400 capitalize">
                              {member.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoomMutation.isPending || !groupName.trim()}
                  className="px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl font-semibold shadow-md shadow-red-900/20 transition-all cursor-pointer"
                >
                  {createRoomMutation.isPending ? 'Creating...' : 'Create Group Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
