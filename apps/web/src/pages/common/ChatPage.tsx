import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { ChatRoom, ChatMessage, User } from '@agencyos/shared';
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Search,
  Sparkles,
  Smile,
  Shield,
  Briefcase,
  CheckCircle,
  X,
  Radio,
} from 'lucide-react';

const EMOJI_OPTIONS = ['🏢', '🔥', '🎯', '🚀', '💬', '💡', '💰', '⚡', '💎', '📈'];
const QUICK_REACTIONS = ['🔥', '🚀', '💰', '🎉', '👍', '👏', '🤝', '🎯'];

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // 4. Socket.IO Real-Time Listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload: { roomId: string; message: ChatMessage }) => {
      // If message is for currently active room, update cache
      if (payload.roomId === activeRoomId) {
        queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => {
          if (old.some((m) => m._id === payload.message._id)) return old;
          return [...old, payload.message];
        });
      }
      // Also invalidate rooms list so lastMessage updates
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };

    const handleRoomCreated = (newRoom: ChatRoom) => {
      queryClient.setQueryData<ChatRoom[]>(['chat-rooms'], (old = []) => [newRoom, ...old]);
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:room_created', handleRoomCreated);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:room_created', handleRoomCreated);
    };
  }, [activeRoomId, queryClient]);

  // 5. Send Message Mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      api.post(`/chat/rooms/${activeRoomId}/messages`, { message: msg }),
    onSuccess: (newMsg) => {
      setMessageText('');
      queryClient.setQueryData<ChatMessage[]>(['chat-messages', activeRoomId], (old = []) => [
        ...old,
        newMsg,
      ]);
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });

  // 6. Create Group Room Mutation
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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeRoomId) return;
    sendMutation.mutate(messageText.trim());
  };

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

  const filteredRooms = rooms.filter((r) =>
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

              {/* Members Avatars preview */}
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
                  const isSuperAdmin = msg.senderRole === 'SUPER_ADMIN';

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
                            : isSuperAdmin
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
                              isSuperAdmin
                                ? 'bg-red-100 text-[#991B1B]'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSuperAdmin ? 'Admin' : 'Sales'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                            isMe
                              ? 'bg-[#991B1B] text-white rounded-tr-none'
                              : 'bg-white border border-[#E5E7EB] text-slate-900 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
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
                  onClick={() => {
                    sendMutation.mutate(emoji);
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-100 hover:scale-110 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input Composer Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message #${activeRoom.name}... (Press Enter to send)`}
                className="flex-1 bg-[#F5F6F8] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#991B1B]"
              />

              <button
                type="submit"
                disabled={!messageText.trim() || sendMutation.isPending}
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
