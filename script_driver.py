import re

with open('app/driver/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ChatModal import and MessageCircle icon
content = content.replace("CheckCircle, XCircle, Loader2, Check", "CheckCircle, XCircle, Loader2, Check, MessageCircle")
content = content.replace("import { cn } from '@/lib/utils'", "import { cn } from '@/lib/utils'\nimport { ChatModal } from '@/components/chat-modal'")

# Add state for activeChatTrip
state_insertion = "const [processing, setProcessing] = useState<string | null>(null)"
new_state = "const [processing, setProcessing] = useState<string | null>(null)\n  const [activeChatTrip, setActiveChatTrip] = useState<any>(null)"
content = content.replace(state_insertion, new_state)

# Add Chat button in renderConfirmedSection before "Mark Complete" button
mark_complete_pattern = r"(<button\s+disabled=\{processing === trip\.id\}\s+onClick=\{\(\) => handleComplete\(trip\.id\)\})"
chat_button = """<button
                disabled={processing === trip.id}
                onClick={() => setActiveChatTrip(trip)}
                className="p-1 rounded shrink-0 transition-colors text-[var(--orange-brand)] hover:bg-white/5 mr-2"
                aria-label="Chat"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              \\1"""
content = re.sub(mark_complete_pattern, chat_button, content)

# Add ChatModal at the end of the return statement
end_div_pattern = r"(</div>\n    </div>\n  )\n}"
chat_modal_html = """</div>
      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={activeChatTrip.driverId}
          otherPartyName={activeChatTrip.rider?.name ?? 'Rider'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}
    </div>
  )
}"""
content = re.sub(end_div_pattern, chat_modal_html, content)

with open('app/driver/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

