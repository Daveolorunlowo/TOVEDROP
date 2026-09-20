import re

with open('app/driver/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

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

content = content.replace("      </div>\n    </div>\n  )\n}", chat_modal_html)

with open('app/driver/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
