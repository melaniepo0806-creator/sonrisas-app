'use client'
import BottomNav from '@/components/ui/BottomNav'
import ChatSonrisas from '@/components/ui/ChatSonrisas'

export default function FAQPage() {
  return (
    <div className="app-container flex flex-col h-[100dvh]">
      <ChatSonrisas mode="page" />
      <BottomNav />
    </div>
  )
}
