import { useState } from 'react';
import { Card, Button, Badge } from '../common';

const MessageMonitoring = ({ messages, onFlag, onDelete }) => {
  const [filter, setFilter] = useState('all');

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    if (filter === 'flagged') return msg.flagged;
    if (filter === 'clean') return !msg.flagged;
    return true;
  });

  const flaggedCount = messages.filter(m => m.flagged).length;

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Message Monitoring</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review and moderate conversations between users.
            {flaggedCount > 0 && (
              <span className="ml-2 text-rose-600">{flaggedCount} flagged message{flaggedCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'flagged', 'clean'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            className={`group relative rounded-xl border p-4 transition-all ${
              message.flagged
                ? 'border-rose-200 bg-rose-50/50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{message.id}</span>
                  {message.flagged && (
                    <Badge variant="danger" size="sm">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Flagged
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400">{message.timestamp}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-600">
                    <span className="font-medium text-slate-900">From:</span> {message.from}
                  </span>
                  <span className="text-slate-600">
                    <span className="font-medium text-slate-900">To:</span> {message.to}
                  </span>
                </div>

                <p className="mt-2 text-slate-700">{message.text}</p>
              </div>

              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant={message.flagged ? 'warning' : 'secondary'}
                  size="sm"
                  onClick={() => onFlag(message.id)}
                >
                  {message.flagged ? 'Unflag' : 'Flag'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(message.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredMessages.length === 0 && (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">
              {filter === 'flagged' ? 'No flagged messages found.' : 'No messages to display.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Showing {filteredMessages.length} of {messages.length} messages
        </p>
        <Button variant="secondary" size="sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Messages
        </Button>
      </div>
    </Card>
  );
};

export default MessageMonitoring;
