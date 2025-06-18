import ChatContainer from '../components/ChatContainer'
import NoChatSelected from '../components/NoChatSelected'
import Sidebar from '../components/Sidebar'
import { useChatStore } from '../store/useChatStore'

const MessagingPage = () => {
    const {selectedUser} = useChatStore()
  return (
    <div className='min-h-screen bg-base-200 pt-20'>
        <div className='flex items-center justify-center px-4'>
            <div className='bg-base-100 rounded-lg shadow-lg w-full max-w-6xl h-[calc(100vh-6rem)]'>
                <div className='flex h-full rounded-lg overflow-hidden'>
                    <Sidebar/>
                    {!selectedUser ? <NoChatSelected/> : <ChatContainer/>}
                </div>
            </div>
        </div>
    </div>
  )
}

export default MessagingPage