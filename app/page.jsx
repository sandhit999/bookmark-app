
import AuthForm from '@/components/Forms/AuthForm'
import React from 'react'

const page = () => {
  return (
     <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center px-4'>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-4xl">🔖</span>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Smart Bookmarks
          </h1>
          <p className="text-gray-600">
            Sign in to access your personal bookmark collection
          </p>
        </div>
        
        <AuthForm />
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🔒</div>
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-xs text-gray-600">Fast</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🔄</div>
              <p className="text-xs text-gray-600">Real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page