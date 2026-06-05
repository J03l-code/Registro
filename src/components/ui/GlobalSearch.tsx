import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, Users, Star, Calendar, Loader2 } from "lucide-react"

type Result = {
    id: number
    type: 'lead' | 'active' | 'agenda'
    title: string
    subtitle: string
    meta: string
    url: string
}

const TYPE_CONFIG = {
    lead:   { label: 'Prospecto CRM', icon: Users,    color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
    active: { label: 'Cliente Activo', icon: Star,    color: 'text-emerald-500', bg: 'bg-emerald-50' },
    agenda: { label: 'Agenda',         icon: Calendar, color: 'text-amber-500',   bg: 'bg-amber-50'   },
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    // Ctrl+K / Cmd+K para abrir
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    // Focus al abrir
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery('')
            setResults([])
            setSelected(0)
        }
    }, [open])

    // Debounce de búsqueda
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const doSearch = useCallback((q: string) => {
        if (searchRef.current) clearTimeout(searchRef.current)
        if (q.length < 2) { setResults([]); setLoading(false); return }
        setLoading(true)
        searchRef.current = setTimeout(() => {
            fetch(`/api/search.php?q=${encodeURIComponent(q)}`)
                .then(r => r.json())
                .then(d => {
                    if (d.success) setResults(d.results || [])
                })
                .finally(() => setLoading(false))
        }, 280)
    }, [])

    useEffect(() => {
        doSearch(query)
    }, [query, doSearch])

    // Navegación por teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
        if (e.key === 'Enter' && results[selected]) {
            go(results[selected])
        }
    }

    const go = (r: Result) => {
        navigate(r.url)
        setOpen(false)
    }

    // Agrupar por tipo
    const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
        if (!acc[r.type]) acc[r.type] = []
        acc[r.type].push(r)
        return acc
    }, {})

    return (
        <>
            {/* Botón trigger en header */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-3 py-2 transition-colors group"
            >
                <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                <span className="hidden sm:inline font-medium text-gray-400 group-hover:text-gray-600">Buscar...</span>
                <kbd className="hidden sm:inline ml-1 text-[10px] font-black bg-white border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded shadow-sm">
                    Ctrl K
                </kbd>
            </button>

            {/* Overlay + Modal */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                            {loading
                                ? <Loader2 className="w-5 h-5 text-[#4a55c2] animate-spin shrink-0" />
                                : <Search className="w-5 h-5 text-gray-400 shrink-0" />
                            }
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(0) }}
                                onKeyDown={handleKeyDown}
                                placeholder="Buscar clientes, prospectos, tareas..."
                                className="flex-1 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</kbd>
                        </div>

                        {/* Resultados */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {query.length < 2 && (
                                <div className="py-10 text-center text-sm text-gray-400 font-medium">
                                    <Search className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                                    Escribe al menos 2 caracteres para buscar
                                </div>
                            )}

                            {query.length >= 2 && !loading && results.length === 0 && (
                                <div className="py-10 text-center text-sm text-gray-400 font-medium">
                                    Sin resultados para "<strong className="text-gray-600">{query}</strong>"
                                </div>
                            )}

                            {/* Categorías */}
                            {(Object.keys(grouped) as Array<keyof typeof TYPE_CONFIG>).map(type => {
                                const cfg = TYPE_CONFIG[type]
                                const Icon = cfg.icon
                                return (
                                    <div key={type}>
                                        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{cfg.label}</span>
                                        </div>
                                        {grouped[type].map(r => {
                                            const flatIdx = results.findIndex(x => x.id === r.id && x.type === r.type)
                                            const isSelected = flatIdx === selected
                                            return (
                                                <button
                                                    key={`${r.type}-${r.id}`}
                                                    onClick={() => go(r)}
                                                    onMouseEnter={() => setSelected(flatIdx)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                                                        ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                                                        <p className="text-xs text-gray-400 truncate font-medium">{r.subtitle}</p>
                                                    </div>
                                                    {r.meta && (
                                                        <span className="text-[11px] text-gray-400 font-medium shrink-0">{r.meta}</span>
                                                    )}
                                                    {isSelected && (
                                                        <kbd className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0">↵</kbd>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}

                            {results.length > 0 && (
                                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                                    <span>{results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
                                    <span className="flex items-center gap-2">
                                        <kbd className="bg-gray-100 border border-gray-200 px-1 rounded text-[10px]">↑↓</kbd> navegar
                                        <kbd className="bg-gray-100 border border-gray-200 px-1 rounded text-[10px]">↵</kbd> abrir
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
