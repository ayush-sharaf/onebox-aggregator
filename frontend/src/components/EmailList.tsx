import React, { useEffect, useState } from 'react';
import { Search, Filter, Mail, Clock, User, Tag, Sparkles, ChevronDown } from 'lucide-react';
import type { Email } from '../services/email.service';
import { searchEmails, getSuggestedReply } from '../services/email.service';

const Emails: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [uniqueAccounts, setUniqueAccounts] = useState<string[]>([]);
  const [uniqueFolders, setUniqueFolders] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const fetchEmails = async () => {
    const data = await searchEmails({
      query: search,
      account: accountFilter || undefined,
      folder: folderFilter || undefined,
    });

    setEmails(data);
    setUniqueAccounts([...new Set(data.map(email => email.account))]);
    setUniqueFolders([...new Set(data.map(email => email.folder))]);
  };

  useEffect(() => {
    fetchEmails();
  }, [search, accountFilter, folderFilter]);

  const handleSuggestReply = async (email: Email) => {
    const reply = await getSuggestedReply(email.messageId, email.text);
    setSuggestions(prev => ({ ...prev, [email.messageId]: reply }));
  };

  const clearFilters = () => {
    setAccountFilter('');
    setFolderFilter('');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div> {/* <-- Added missing closing div here */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Mail</h1>
                  <p className="text-sm text-slate-500">{emails.length} messages</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search emails..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Filter Pills */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-sm font-medium text-slate-700">Filter by:</span>

              {/* Account Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 font-medium">ACCOUNTS</span>
                {uniqueAccounts.map(account => (
                  <button
                    key={account}
                    onClick={() => setAccountFilter(accountFilter === account ? '' : account)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      accountFilter === account
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {account}
                  </button>
                ))}
              </div>

              {/* Folder Filter */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 font-medium">FOLDERS</span>
                {uniqueFolders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setFolderFilter(folderFilter === folder ? '' : folder)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      folderFilter === folder
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {folder}
                  </button>
                ))}
              </div>

              {(accountFilter || folderFilter || search) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="space-y-4">
          {emails.map((email,idx) => (
            <div
              key={`${email.messageId}-${idx}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all group"
            >
              {/* Email Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{email.subject}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{email.from}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>
                          <strong>To:</strong> {email.to.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(email.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div className="mb-4">
                <p className="text-slate-700 leading-relaxed line-clamp-3">{email.text}</p>
              </div>

              {/* Tags and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      email.folder === 'Work'
                        ? 'bg-blue-100 text-blue-700'
                        : email.folder === 'Personal'
                        ? 'bg-green-100 text-green-700'
                        : email.folder === 'Inbox'
                        ? 'bg-purple-100 text-purple-700'
                        : email.folder === 'Sent'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {email.folder}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                    {email.account}
                  </span>
                  {email.labels.map(label => (
                    <span
                      key={label}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md"
                    >
                      <Tag className="w-3 h-3" />
                      {label}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleSuggestReply(email)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Reply
                </button>
              </div>

              {/* AI Suggestion */}
              {suggestions[email.messageId] && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">AI Suggested Reply</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{suggestions[email.messageId]}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors">
                          Use Reply
                        </button>
                        <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors">
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {emails.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No emails found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Emails;
