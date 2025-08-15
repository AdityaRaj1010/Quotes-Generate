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

  // Fallback quotes for when API is unavailable
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
    }
  ];

  // Determine API base URL based on environment
  const getApiUrl = (endpoint) => {
    if (import.meta.env.DEV) {
      // Development: use proxy
      return `/api${endpoint}`;
    } else {
      // Production: use direct API calls
      return `https://api.quotable.io${endpoint}`;
    }
  };

  // Try multiple API approaches with proper error handling
  async function fetchFromAPI(endpoint) {
    const approaches = [
      // Primary approach based on environment
      async () => {
        const url = getApiUrl(endpoint);
        console.log('Trying primary approach:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.json();
      },
      
      // Fallback: Direct API call (in case proxy fails in dev)
      async () => {
        const url = `https://api.quotable.io${endpoint}`;
        console.log('Trying direct API approach:', url);
        const res = await fetch(url, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.json();
      },
      
      // Last resort: CORS proxy
      async () => {
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.quotable.io${endpoint}`)}`;
        console.log('Trying CORS proxy approach:', proxiedUrl);
        const res = await fetch(proxiedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.json();
      }
    ];

    let lastError;
    for (const [index, approach] of approaches.entries()) {
      try {
        const result = await approach();
        console.log(`API approach ${index + 1} succeeded`);
        return result;
      } catch (err) {
        console.log(`API approach ${index + 1} failed:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    throw new Error(`All API approaches failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
  
  // Fetch a random quote (optionally by tag)
  async function fetchRandom(optionalTag) {
    setLoading(true);
    setError(null);
    try {
      const endpoint = optionalTag
        ? `/random?tags=${encodeURIComponent(optionalTag)}`
        : `/random`;
      
      const data = await fetchFromAPI(endpoint);
      setQuote(data);
      console.log('Successfully fetched quote:', data.author);
    } catch (err) {
      console.error("All fetch attempts failed:", err);
      // Use random fallback quote
      const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(randomFallback);
      setError("Using offline quote (API temporarily unavailable)");
    } finally {
      setLoading(false);
    }
  }

  // Search quotes (returns first match) - simple implementation
  async function searchQuotes(query) {
    if (!query) return fetchRandom();
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/search/quotes?query=${encodeURIComponent(query)}&limit=1`;
      const data = await fetchFromAPI(endpoint);
      
      if (data.count && data.results && data.results.length > 0) {
        setQuote(data.results[0]);
        console.log('Successfully searched quotes');
      } else {
        // Search in fallback quotes if API search fails
        const searchResults = fallbackQuotes.filter(q => 
          q.content.toLowerCase().includes(query.toLowerCase()) ||
          q.author.toLowerCase().includes(query.toLowerCase()) ||
          q.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        if (searchResults.length > 0) {
          setQuote(searchResults[0]);
          setError("Using offline search results (API temporarily unavailable)");
        } else {
          setError("No results found in offline quotes.");
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      // Search in fallback quotes
      const searchResults = fallbackQuotes.filter(q => 
        q.content.toLowerCase().includes(query.toLowerCase()) ||
        q.author.toLowerCase().includes(query.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      if (searchResults.length > 0) {
        setQuote(searchResults[0]);
        setError("Using offline search results (API temporarily unavailable)");
      } else {
        setError("No results found in offline quotes.");
      }
    } finally {
      setLoading(false);
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