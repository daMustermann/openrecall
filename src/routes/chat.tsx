import Chat from '@/features/chat/Chat'

export default function ChatRoute() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Chat Assistant</h1>
                    <p className="text-white/70">Ask questions about your digital history</p>
                </div>
            </div>

            <Chat />
        </div>
    )
}
