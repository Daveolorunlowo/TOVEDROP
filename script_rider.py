import re

with open('components/dashboard/TripList.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ChatModal import and MessageCircle icon
content = content.replace("import { X, Star, Car, TrendingUp } from 'lucide-react'", "import { X, Star, Car, TrendingUp, MessageCircle } from 'lucide-react'")
content = content.replace("import { useRouter } from 'next/navigation'", "import { useRouter } from 'next/navigation'\nimport { ChatModal } from '@/components/chat-modal'")

# Add state for activeChatTrip
state_insertion = "const [processing, setProcessing] = useState<string | null>(null)"
new_state = "const [processing, setProcessing] = useState<string | null>(null)\n  const [activeChatTrip, setActiveChatTrip] = useState<any>(null)"
content = content.replace(state_insertion, new_state)

# Add Chat button before Cancel button
cancel_button_pattern = r"(<button\s+disabled=\{processing === trip\.id\}\s+onClick=\{\(\) => handleCancel\(trip\.id\)\})"
chat_button = """{trip.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setActiveChatTrip(trip)}
                    className="p-1 rounded shrink-0 transition-colors text-[var(--orange-brand)] hover:bg-white/5 mr-1"
                    aria-label="Chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
                \\1"""
content = re.sub(cancel_button_pattern, chat_button, content)

# Add ChatModal at the end of the return statement
end_div_pattern = r"(</div>\n    </div>\n  )\n}"
chat_modal_html = """</div>
      {activeChatTrip && (
        <ChatModal
          tripId={activeChatTrip.id}
          currentUserId={activeChatTrip.riderId}
          otherPartyName={activeChatTrip.driver?.name ?? 'Driver'}
          onClose={() => setActiveChatTrip(null)}
        />
      )}
    </div>
  )
}"""
content = re.sub(end_div_pattern, chat_modal_html, content)


with open('components/dashboard/TripList.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

