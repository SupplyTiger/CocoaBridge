import React from 'react'
import {ArrowLeft, ArrowRight} from "lucide-react";
const PaginationButton = ( {totalPages, onPageChange, currentPage, size }) => {
  return (
              <div className="flex justify-center mt-4">
                <div className="join text-accent-content">
                  <button
                    className={`join-item btn bg-primary/60 hover:bg-primary/80 border border-primary-content/60 text-primary-content` + (size ? ` btn-${size}` : '')}
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button className={`join-item btn bg-accent/40 pointer-events-none border border-accent-content/40 text-accent-content` + (size ? ` btn-${size}` : '')}>
                    Page {currentPage} of {totalPages}
                  </button>
                  <button
                    className={`join-item btn bg-primary/60 hover:bg-primary/80 border border-primary-content/60 text-primary-content` + (size ? ` btn-${size}` : '')}
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
  )
}
export default PaginationButton;
