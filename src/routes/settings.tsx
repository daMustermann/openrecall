import { useState, useEffect } from 'react'
import { aiClient } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function Settings() {
    const { toast } = useToast()
    const [config, setConfig] = useState({
        ai_provider: 'lm_studio',
        api_base: 'http://localhost:1234/v1',
        api_key: 'lm-studio',
        embedding_model: 'text-embedding-nomic-embed-text-v1.5',
        chat_model: 'llama-3.2-3b-instruct'
    })
    const [loading, setLoading] = useState(true)
    const [models, setModels] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadConfig()
        fetchModels()
    }, [])

    async function fetchModels() {
        const fetchedModels = await aiClient.fetchModels()
        setModels(fetchedModels)
    }

    async function loadConfig() {
        try {
            const data = await aiClient.getConfig()
            setConfig(data)
        } catch (error) {
            toast({
                title: 'Error loading settings',
                description: 'Failed to load configuration from server.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    async function saveConfig() {
        console.log('Saving config:', config)
        setSaving(true)
        try {
            await aiClient.saveConfig(config)
            toast({
                title: 'Settings saved',
                description: 'Configuration has been updated successfully.'
            })
        } catch (error) {
            console.error('Error saving config:', error)
            toast({
                title: 'Error saving settings',
                description: 'Failed to save configuration.',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    const providers = [
        { value: 'lm_studio', label: 'LM Studio (Local)' },
        { value: 'ollama', label: 'Ollama (Local)' },
        { value: 'openai', label: 'OpenAI' },
        { value: 'custom', label: 'Custom OpenAI Compatible' }
    ]

    const embeddingKeywords = ['embed', 'nomic', 'bert']
    const chatKeywords = ['instruct', 'chat', 'llama', 'mistral', 'gpt', 'phi']

    const embeddingModels = models.filter(m => embeddingKeywords.some(k => m.toLowerCase().includes(k)))
    const chatModels = models.filter(m => !embeddingKeywords.some(k => m.toLowerCase().includes(k)))

    // If heuristics fail (empty lists), fallback to showing all
    const embeddingOptions = embeddingModels.length > 0 ? embeddingModels : models
    const chatOptions = chatModels.length > 0 ? chatModels : models

    const isLikelyChatModel = (model: string) => {
        return chatKeywords.some(k => model.toLowerCase().includes(k)) && !embeddingKeywords.some(k => model.toLowerCase().includes(k))
    }

    if (loading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-cyan">Settings</h1>
                <Button variant="ghost" onClick={() => window.history.back()}>
                    Back
                </Button>
            </div>

            <Card className="bg-card/50 backdrop-blur border-white/10">
                <CardHeader>
                    <CardTitle>AI Configuration</CardTitle>
                    <CardDescription>Configure your AI backend for embeddings and summaries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <Select
                            value={config.ai_provider}
                            onValueChange={(val) => setConfig({ ...config, ai_provider: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>API Base URL</Label>
                        <Input
                            value={config.api_base}
                            onChange={(e) => setConfig({ ...config, api_base: e.target.value })}
                            placeholder="http://localhost:1234/v1"
                        />
                        <p className="text-xs text-muted-foreground">
                            Default for LM Studio: http://localhost:1234/v1<br />
                            Default for Ollama: http://localhost:11434/v1
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            value={config.api_key}
                            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                            placeholder="lm-studio"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Embedding Model</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    value={config.embedding_model}
                                    onChange={(val) => setConfig({ ...config, embedding_model: val })}
                                    options={embeddingOptions}
                                    placeholder="Select embedding model..."
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchModels}
                                title="Refresh Models"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                            </Button>
                        </div>
                        <Input
                            value={config.embedding_model}
                            onChange={(e) => setConfig({ ...config, embedding_model: e.target.value })}
                            placeholder="Or type model name manually..."
                            className="mt-2"
                        />
                        {isLikelyChatModel(config.embedding_model) && (
                            <p className="text-xs text-yellow-500 font-medium mt-1">
                                Warning: This looks like a chat model. Using it for embeddings may be very slow and consume many tokens. Please select an embedding model (e.g. nomic-embed).
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Chat Model</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SearchableSelect
                                    value={config.chat_model}
                                    onChange={(val) => setConfig({ ...config, chat_model: val })}
                                    options={chatOptions}
                                    placeholder="Select chat model..."
                                />
                            </div>
                        </div>
                        <Input
                            value={config.chat_model}
                            onChange={(e) => setConfig({ ...config, chat_model: e.target.value })}
                            placeholder="Or type model name manually..."
                            className="mt-2"
                        />
                    </div>

                    <Button
                        onClick={saveConfig}
                        disabled={saving}
                        className="w-full bg-cyan text-black hover:bg-cyan/80"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold mb-2">Maintenance</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            If search results are poor or you've changed embedding models, try rebuilding the search index.
                            This process regenerates embeddings for all past entries.
                        </p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 mb-4 text-sm text-yellow-200">
                            <strong>Warning:</strong> Reindexing will process ALL your history. If using a paid API or a large local model, this may consume a significant amount of tokens/compute. Ensure you have selected a small, efficient <strong>embedding model</strong> above.
                        </div>
                        <Button
                            variant="secondary"
                            onClick={async () => {
                                if (!confirm('This will regenerate embeddings for all entries. It may take a significant amount of time and tokens. Are you sure you want to continue?')) return
                                try {
                                    toast({ title: 'Reindexing started', description: 'Please wait...' })
                                    await aiClient.reindex()
                                    toast({ title: 'Reindexing complete', description: 'Search index has been rebuilt.' })
                                } catch (e) {
                                    toast({ title: 'Reindexing failed', variant: 'destructive' })
                                }
                            }}
                            className="w-full"
                        >
                            Rebuild Search Index
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
