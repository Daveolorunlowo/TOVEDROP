'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  basePath?: string
  itemsPerPage?: number
}

export function PaginationControls({ currentPage, totalPages, totalItems, basePath, itemsPerPage = 8 }: PaginationControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    
    // Scroll to top of the list/container, not necessarily window.top
    const container = document.getElementById('paginated-container')
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    if (basePath) {
      router.push(`${basePath}?${params.toString()}`, { scroll: false })
    } else {
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }

  if (totalPages <= 1) return null

  // Generate page numbers
  const pages = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </p>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map((p, i) => (
          <button
            key={i}
            disabled={p === '...'}
            onClick={() => typeof p === 'number' && handlePageChange(p)}
            className={`w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors ${
              p === currentPage 
                ? 'bg-orange-brand text-foreground' 
                : p === '...' 
                  ? 'text-muted-foreground cursor-default' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
