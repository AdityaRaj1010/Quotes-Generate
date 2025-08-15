import React, { useEffect, useState } from "react";

export default function QuotesGenerator() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("quotes:favorites")) || [];
    } catch (e) {
      console.log(e);
      return [];
    }
  });

  // Fallback quotes for when APIs are unavailable
  const fallbackQuotes = [
    {
      _id: "fallback-1",
      content: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      tags: ["motivational", "work"]
    },
    {
      _id: "fallback-2",
      content: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
      tags: ["innovation", "leadership"]
    },
    {
      _id: "fallback-3",
      content: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      tags: ["dreams", "future"]
    },
    {
      _id: "fallback-4",
      content: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle",
      tags: ["wisdom", "hope"]
    },
    {
      _id: "fallback-5",
      content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      tags: ["success", "courage"]
    },
    {
      _id: "fallback-6",
      content: "Be yourself; everyone else is already taken.",
      author: "Oscar Wilde",
      tags: ["wisdom", "authenticity"]
    },
    {
      _id: "fallback-7",
      content: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
      author: "Albert Einstein",
      tags: ["humor", "wisdom"]
    },
    {
      _id: "fallback-8",
      content: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
      tags: ["opportunity", "difficulty"]
    },
    {
      _id: "fallback-9",
      content: "Life is what happens to you while you're busy making other plans.",
      author: "John Lennon",
      tags: ["life", "wisdom"]
    },
    {
      _id: "fallback-10",
      content: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins",
      tags: ["motivation", "journey"]
    },
    {
      _id: "fallback-11",
      content: "Yesterday is history, tomorrow is a mystery, today is a gift.",
      author: "Eleanor Roosevelt",
      tags: ["present", "wisdom"]
    },
    {
      _id: "fallback-12",
      content: "The best time to plant a tree was 20 years ago. The second best time is now.",
      author: "Chinese Proverb",
      tags: ["action", "wisdom"]
    },
    {
      _id: "fallback-13",
      content: "Don't watch the clock; do what it does. Keep going.",
      author: "Sam Levenson",
      tags: ["persistence", "motivation"]
    },
    {
      _id: "fallback-14",
      content: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
      tags: ["action", "motivation"]
    },
    {
      _id: "fallback-15",
      content: "If you want to lift yourself up, lift up someone else.",
      author: "Booker T. Washington",
      tags: ["kindness", "leadership"]
    }
  ];

  // Try multiple quote APIs with environment-aware URLs
  async function fetchFromAPI() {
    const isDev = import.meta.env.DEV;
    
    const apis = [
      // API 1: ZenQuotes
      async () => {
        console.log('Trying ZenQuotes API...');
        const url = isDev ? '/api/zenquotes/random' : 'https://zenquotes.io/api/random';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`ZenQuotes HTTP ${response.status}`);
        const data = await response.json();
        return {
          _id: `zen-${Date.now()}`,
          content: data[0].q,
          author: data[0].a === 'zenquotes.io' ? 'Unknown' : data[0].a,
          tags: ['inspiration']
        };
      },
      
      // API 2: Quotable (original)
      async () => {
        console.log('Trying Quotable API...');
        const url = isDev ? '/api/quotable/random' : 'https://api.quotable.io/random';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Quotable HTTP ${response.status}`);
        const data = await response.json();
        return {
          _id: data._id || `quotable-${Date.now()}`,
          content: data.content,
          author: data.author,
          tags: data.tags || ['general']
        };
      },
      
      // API 3: Use a working CORS proxy as last resort
      async () => {
        console.log('Trying CORS proxy with ZenQuotes...');
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://zenquotes.io/api/random'));
        if (!response.ok) throw new Error(`CORS Proxy HTTP ${response.status}`);
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        return {
          _id: `proxy-zen-${Date.now()}`,
          content: data[0].q,
          author: data[0].a === 'zenquotes.io' ? 'Unknown' : data[0].a,
          tags: ['inspiration']
        };
      }
    ];

    let lastError;
    for (const [index, api] of apis.entries()) {
      try {
        const result = await api();
        console.log(`API ${index + 1} succeeded:`, result.author);
        return result;
      } catch (err) {
        console.log(`API ${index + 1} failed:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    throw new Error(`All APIs failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Fetch a random quote (optionally by tag)
  async function fetchRandom(optionalTag) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromAPI();
      setQuote(data);
      console.log('Successfully fetched quote from API');
    } catch (err) {
      console.error("All API attempts failed:", err);
      // Use random fallback quote
      const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      
      // If tag is specified, try to find a matching fallback
      if (optionalTag) {
        const taggedFallbacks = fallbackQuotes.filter(q => 
          q.tags.some(tag => tag.toLowerCase().includes(optionalTag.toLowerCase()))
        );
        if (taggedFallbacks.length > 0) {
          setQuote(taggedFallbacks[Math.floor(Math.random() * taggedFallbacks.length)]);
          setError(`Using offline ${optionalTag} quote (APIs temporarily unavailable)`);
        } else {
          setQuote(randomFallback);
          setError(`No offline quotes found for "${optionalTag}". Using random offline quote.`);
        }
      } else {
        setQuote(randomFallback);
        setError("Using offline quote (APIs temporarily unavailable)");
      }
    } finally {
      setLoading(false);
    }
  }

  // Search quotes (returns first match) - simple implementation
  async function searchQuotes(query) {
    if (!query) return fetchRandom();
    setLoading(true);
    setError(null);
    
    // For now, search only works with fallback quotes since APIs have different search formats
    console.log('Searching in offline quotes for:', query);
    
    const searchResults = fallbackQuotes.filter(q => 
      q.content.toLowerCase().includes(query.toLowerCase()) ||
      q.author.toLowerCase().includes(query.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    
    setLoading(false);
    
    if (searchResults.length > 0) {
      setQuote(searchResults[0]);
      if (searchResults.length === 1) {
        setError("Found 1 matching offline quote");
      } else {
        setError(`Found ${searchResults.length} matching offline quotes (showing first)`);
      }
    } else {
      setError("No results found in offline quotes. Try 'motivation', 'wisdom', 'success', etc.");
    }
  }

  useEffect(() => {
    // fetch an initial quote on mount
    fetchRandom();
  }, []);

  useEffect(() => {
    localStorage.setItem("quotes:favorites", JSON.stringify(favorites));
  }, [favorites]);

  function toggleFavorite(q) {
    const exists = favorites.find((f) => f._id === q._id);
    if (exists) {
      setFavorites((s) => s.filter((f) => f._id !== q._id));
    } else {
      setFavorites((s) => [q, ...s]);
    }
  }

  function copyToClipboard(text) {
    if (!navigator.clipboard) {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return;
    }
    navigator.clipboard.writeText(text).catch(err => {
      console.error("Copy failed:", err);
    });
  }

  function tweetQuote(q) {
    const text = `"${q.content}" — ${q.author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Quotes Generator</h1>
          <div className="space-x-2">
            <input
              className="px-3 py-1 border rounded-md"
              placeholder="tag (e.g. wisdom, love)"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
            <button
              className="px-3 py-1 rounded-md border hover:bg-slate-50"
              onClick={() => fetchRandom(tag)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Random by Tag"}
            </button>
          </div>
        </header>

        <main className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ) : error ? (
              <div className="text-red-600">Error: {error}</div>
            ) : quote ? (
              <div>
                <blockquote className="text-xl italic leading-relaxed">"{quote.content}"</blockquote>
                <p className="mt-4 text-sm text-slate-600">— {quote.author}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1 rounded-md border hover:bg-slate-50"
                    onClick={() => fetchRandom()}
                    disabled={loading}
                  >
                    New Quote
                  </button>

                  <button
                    className="px-3 py-1 rounded-md border hover:bg-slate-50"
                    onClick={() => toggleFavorite(quote)}
                  >
                    {favorites.find((f) => f._id === quote._id) ? "Unfavorite" : "Favorite"}
                  </button>

                  <button
                    className="px-3 py-1 rounded-md border hover:bg-slate-50"
                    onClick={() => copyToClipboard(`"${quote.content}" — ${quote.author}`)}
                  >
                    Copy
                  </button>

                  <button
                    className="px-3 py-1 rounded-md border hover:bg-slate-50"
                    onClick={() => tweetQuote(quote)}
                  >
                    Tweet
                  </button>
                </div>

                {/* tags (if available) */}
                {quote.tags && quote.tags.length > 0 && (
                  <div className="mt-3 text-sm text-slate-500">Tags: {quote.tags.join(", ")}</div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">No quote yet — click New Quote</div>
            )}
          </div>

          {/* Search panel */}
          <div className="bg-white p-4 rounded-lg shadow-sm flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Search quotes (keyword)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchQuotes(search);
              }}
            />
            <button
              className="px-4 rounded-md border hover:bg-slate-50"
              onClick={() => searchQuotes(search)}
              disabled={loading}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {/* Favorites */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Favorites ({favorites.length})</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded-md hover:bg-slate-50"
                  onClick={() => {
                    setFavorites([]);
                    localStorage.removeItem("quotes:favorites");
                  }}
                >
                  Clear
                </button>
                <button
                  className="px-3 py-1 border rounded-md hover:bg-slate-50"
                  onClick={() => {
                    // show random favorite
                    if (favorites.length) setQuote(favorites[Math.floor(Math.random() * favorites.length)]);
                  }}
                >
                  Random Favorite
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {favorites.length === 0 ? (
                <div className="text-sm text-slate-500">No favorites yet — click Favorite on a quote.</div>
              ) : (
                favorites.map((f) => (
                  <div key={f._id} className="p-3 border rounded-md flex justify-between items-start">
                    <div>
                      <div className="italic">"{f.content.length > 120 ? f.content.slice(0, 120) + '...' : f.content}"</div>
                      <div className="text-sm text-slate-600">— {f.author}</div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button 
                        className="px-2 py-1 border rounded-md hover:bg-slate-50" 
                        onClick={() => setQuote(f)}
                      >
                        Open
                      </button>
                      <button 
                        className="px-2 py-1 border rounded-md hover:bg-slate-50" 
                        onClick={() => toggleFavorite(f)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <footer className="text-xs text-slate-500 text-center">• No signup required</footer>
        </main>
      </div>
    </div>
  );
}