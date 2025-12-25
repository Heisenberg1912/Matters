import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Search, User, Send, Bot, Users, Sparkles, ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '../components/Card'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

// Message bubble component
function MessageBubble({ message, isOwn, showAvatar = true }) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {showAvatar && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isOwn ? 'bg-primary-100' : 'bg-slate-100'
        }`}>
          {message.sender?.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-slate-400" />
          )}
        </div>
      )}
      <div className={`max-w-[75%] ${!showAvatar ? (isOwn ? 'mr-10' : 'ml-10') : ''}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-900 rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {new Date(message.createdAt || message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {message.isEdited && ' (edited)'}
        </p>
      </div>
    </div>
  )
}

// AI Chat View
function AIChatView({ onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add welcome message on mount
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: "Hello! I'm Matters AI, your construction project assistant. How can I help you today? You can ask me about:\n\n• Project management tips\n• Budget tracking\n• Construction best practices\n• Weather planning\n• Safety guidelines",
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.post('/chat', {
        message: userMessage.content,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      })

      if (response.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Matters AI</h2>
          <p className="text-xs text-slate-500">Construction Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user'
                  ? 'bg-primary-100'
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-primary-600" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="max-w-[75%]">
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white text-slate-900 rounded-bl-md shadow-sm border border-slate-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-slate-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about construction..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Direct Message View
function DirectMessageView({ conversation, onBack }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadMessages()
  }, [conversation.otherUser._id])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/messages/conversation/${conversation.otherUser._id}`)
      if (response.success) {
        setMessages(response.data.messages)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: input.trim(),
      sender: { _id: user._id, name: user.name },
      createdAt: new Date().toISOString(),
      pending: true,
    }

    setMessages((prev) => [...prev, tempMessage])
    setInput('')
    setSending(true)

    try {
      const response = await api.post('/messages/send', {
        recipientId: conversation.otherUser._id,
        content: tempMessage.content,
      })

      if (response.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempMessage._id ? response.data.message : m
          )
        )
      }
    } catch (error) {
      // Mark message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempMessage._id ? { ...m, failed: true, pending: false } : m
        )
      )
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          {conversation.otherUser.avatar ? (
            <img
              src={conversation.otherUser.avatar}
              alt={conversation.otherUser.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{conversation.otherUser.name}</h2>
          <p className="text-xs text-slate-500">
            {conversation.otherUser.contractor?.company || conversation.otherUser.role}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">No messages yet</p>
            <p className="text-slate-400 text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender._id === user._id
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender._id !== message.sender._id

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Chat Component
export default function Chat() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('list') // 'list', 'ai', 'dm'
  const [selectedConversation, setSelectedConversation] = useState(null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/messages/conversations')
      if (response.success) {
        setConversations(response.data.conversations)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
    conv.otherUser?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openConversation = (conv) => {
    setSelectedConversation(conv)
    setActiveView('dm')
  }

  if (activeView === 'ai') {
    return <AIChatView onBack={() => setActiveView('list')} />
  }

  if (activeView === 'dm' && selectedConversation) {
    return (
      <DirectMessageView
        conversation={selectedConversation}
        onBack={() => {
          setActiveView('list')
          setSelectedConversation(null)
          loadConversations()
        }}
      />
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* AI Assistant Card */}
        <Card hover onClick={() => setActiveView('ai')} className="mb-4">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900">Matters AI Assistant</h4>
              <p className="text-slate-500 text-sm truncate">
                Get help with construction questions
              </p>
            </div>
            <div className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              AI
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-medium text-slate-500">Direct Messages</h2>
        </div>

        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 text-sm mt-4">Loading conversations...</p>
            </CardContent>
          </Card>
        ) : filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No conversations yet</h3>
              <p className="text-slate-500 text-sm">
                When you work on projects, you can chat with clients here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Card key={conv.id} hover onClick={() => openConversation(conv)}>
                <CardContent className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      {conv.otherUser?.avatar ? (
                        <img
                          src={conv.otherUser.avatar}
                          alt={conv.otherUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900 truncate">
                        {conv.otherUser?.name || 'Unknown User'}
                      </h4>
                      <span className="text-slate-400 text-xs">
                        {new Date(conv.lastMessage?.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {conv.lastMessage?.content}
                    </p>
                    {conv.project && (
                      <p className="text-xs text-primary-600 mt-1">
                        {conv.project.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
