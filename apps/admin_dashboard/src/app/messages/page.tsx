'use client';

import TopHeader from '@/components/TopHeader';
import { useState, useEffect, useRef } from 'react';
import { Send, User, Search, Clock, Paperclip, MoreVertical, MessageSquare, CheckCircle2 } from 'lucide-react';

const MOCK_CHANNELS = [
    {
        id: '1',
        name: 'AutoRABIT Admin',
        role: 'Platform Administrator',
        avatar: 'AR',
        status: 'online',
        lastMessage: 'Invoice #INV-2026-1024 has been processed.',
        time: '10:30 AM',
        unread: 2
    },
    {
        id: '2',
        name: 'System Notifications',
        role: 'Automated',
        avatar: 'SYS',
        status: 'offline',
        lastMessage: 'Your weekly report is ready to download.',
        time: 'Yesterday',
        unread: 0
    }
];

const INITIAL_MESSAGES = {
    '1': [
        { id: 1, sender: 'them', text: 'Hello! Welcome to the Lunch Break Buddy Vendor Portal.', time: 'Monday, 9:00 AM' },
        { id: 2, sender: 'me', text: 'Hi, I just submitted the invoice for January.', time: 'Monday, 9:05 AM' },
        { id: 3, sender: 'them', text: 'Thanks, we received it. It is currently under review.', time: 'Monday, 9:15 AM' },
        { id: 4, sender: 'them', text: 'Just a heads up, payment processing might take 2-3 days this week due to bank holidays.', time: 'Today, 10:28 AM' },
        { id: 5, sender: 'them', text: 'Invoice #INV-2026-1024 has been processed.', time: 'Today, 10:30 AM' }
    ],
    '2': [
        { id: 1, sender: 'them', text: 'Welcome to Lunch Break Buddy!', time: 'Jan 01' },
        { id: 2, sender: 'them', text: 'Compliance docs verified successfully.', time: 'Jan 05' },
        { id: 3, sender: 'them', text: 'Your weekly report is ready to download.', time: 'Yesterday' }
    ]
};

export default function MessagesPage() {
    const [activeChannelId, setActiveChannelId] = useState('1');
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const activeChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId);
    const currentMessages = messages[activeChannelId as keyof typeof messages] || [];

    // Load from LocalStorage on Mount
    useEffect(() => {
        const storedMatches = localStorage.getItem('lbb_messages');
        if (storedMatches) {
            setMessages(JSON.parse(storedMatches));
        } else {
            // Seed initial
            localStorage.setItem('lbb_messages', JSON.stringify(INITIAL_MESSAGES));
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages, activeChannelId]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'me',
            text: inputText,
            time: 'Just now'
        };

        const updatedMessages = {
            ...messages,
            [activeChannelId]: [...(messages[activeChannelId as keyof typeof messages] || []), newMessage]
        };

        setMessages(updatedMessages);
        localStorage.setItem('lbb_messages', JSON.stringify(updatedMessages));
        setInputText('');

        // Simulate Reply
        if (activeChannelId === '1') {
            setTimeout(() => {
                const reply = {
                    id: Date.now() + 1,
                    sender: 'them',
                    text: 'Thanks for your message. An admin will review this shortly.',
                    time: 'Just now'
                };

                // Re-read current state to avoid closure staleness or race conditions (simple approach)
                setMessages(prev => {
                    const newPrev = {
                        ...prev,
                        [activeChannelId]: [...(prev[activeChannelId as keyof typeof prev] || []), reply]
                    };
                    localStorage.setItem('lbb_messages', JSON.stringify(newPrev));
                    return newPrev;
                });
            }, 2000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
            {/* Standard Top Header */}
            <div className="flex-shrink-0">
                <TopHeader title="Communications" />
            </div>

            <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-7xl w-full mx-auto">
                {/* LEFT SIDEBAR: CHANNELS */}
                <div className="w-80 flex flex-col bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {MOCK_CHANNELS.map(channel => (
                            <div
                                key={channel.id}
                                onClick={() => setActiveChannelId(channel.id)}
                                className={`p-4 border-b cursor-pointer transition hover:bg-gray-50 ${activeChannelId === channel.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${channel.id === '1' ? 'bg-orange-500 shadow-sm' : 'bg-gray-400'}`}>
                                            {channel.avatar}
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-semibold ${activeChannelId === channel.id ? 'text-blue-900' : 'text-gray-900'}`}>{channel.name}</h3>
                                            <p className="text-xs text-gray-500">{channel.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{channel.time}</span>
                                </div>
                                <p className={`text-xs mt-2 line-clamp-1 ${channel.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                    {channel.lastMessage}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: CHAT WINDOW */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${activeChannel?.id === '1' ? 'bg-orange-500' : 'bg-gray-400'}`}>
                                {activeChannel?.avatar}
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-900 flex items-center gap-2">
                                    {activeChannel?.name}
                                    {activeChannel?.id === '1' && <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-50" />}
                                </h1>
                                <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${activeChannel?.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <span className="text-xs text-gray-500 capitalize">{activeChannel?.status || 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
                            <MoreVertical className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
                        <div className="flex justify-center">
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Today</span>
                        </div>

                        {currentMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[70%] ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`px-5 py-3 rounded-2xl text-sm shadow-sm relative group ${msg.sender === 'me'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border rounded-bl-none'
                                            }`}
                                    >
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t">
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-2 py-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition">
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-900 placeholder-gray-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputText.trim()}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-2">
                            Press Enter to send. Messages are monitored for quality assurance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
