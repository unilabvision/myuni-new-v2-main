// components/CourseLoadingSkeleton.tsx
"use client";

import React from 'react';

const CourseLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation Skeleton */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 sm:py-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Course Type Header Skeleton - For live/hybrid courses */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-24 animate-pulse"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-1">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28 animate-pulse"></div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
            <div className="flex items-center gap-6">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-24 animate-pulse"></div>
              <div className="flex items-center gap-6">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28 animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Clean Header Section - Similar to blog page */}
      <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Mobile Course Preview - Only for online courses */}
          <div className="block lg:hidden mb-8">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse"></div>
              </h3>
              <div className="relative bg-neutral-200 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-neutral-400 dark:bg-neutral-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="h-8 md:h-10 lg:h-12 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 sm:w-2/3 animate-pulse mb-6"></div>
          
          {/* Meta Information */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
          </div>
          
          {/* Description - Desktop only */}
          <div className="hidden sm:block">
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6 animate-pulse"></div>
            </div>
            
            {/* Feature Pills - Desktop only */}
            <div className="hidden sm:flex flex-wrap gap-2">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-24 animate-pulse"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-28 animate-pulse"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-32 animate-pulse"></div>
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20 animate-pulse"></div>
            </div>
          </div>

          {/* Mobile: Only CTA text */}
          <div className="block sm:hidden">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
        {/* Live Course Additional Info Skeleton */}
        <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48 sm:w-64 animate-pulse mb-4 sm:mb-6"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-24 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-600 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout - Sidebar content first */}
        <div className="block lg:hidden space-y-6">
          {/* Course Sidebar - Mobile version */}
          <div className="space-y-6">
            {/* Purchase Card Skeleton */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 md:p-6 rounded-sm">
              {/* Price Skeleton */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-3 mb-2">
                  <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700 mb-3"></div>
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
              </div>

              {/* Course Info Skeleton */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>

              {/* Button Skeleton */}
              <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse"></div>
            </div>

            {/* Latest Courses Skeleton */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-sm">
                    <div className="w-12 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded mb-2"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Original grid */}
        <div className="hidden lg:grid grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content - Left side */}
          <div className="col-span-2 space-y-8 sm:space-y-12">
            {/* Course Info Skeleton */}
            <div className="space-y-12">
              {/* Tab Navigation Skeleton */}
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-4 flex-shrink-0">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-16 sm:w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab Content Skeleton */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-11/12 animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5 animate-pulse"></div>
                </div>

                {/* Highlights Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-3 sm:mb-4 animate-pulse"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Skeleton */}
              <div className="pt-6 sm:pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse mx-auto sm:mx-0"></div>
                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 sm:w-1/3 mx-auto sm:mx-0 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 mx-auto sm:mx-0 animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 animate-pulse"></div>
                          <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Sections Skeleton - Only for online courses */}
            <div className="space-y-6">
              <div className="text-left">
                <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-32 sm:w-40 animate-pulse mb-4"></div>
                <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700 mb-4 sm:mb-6"></div>
                <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-64 sm:w-80 animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden bg-white dark:bg-neutral-800">
                    <div className="p-4 sm:p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm flex items-center justify-center animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-1/2 animate-pulse"></div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
                            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Card Skeleton */}
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse mt-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* MyUNI Products Features Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 sm:p-8 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded flex-1 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Certificate Skeleton */}
            <div className="p-6 sm:p-8 bg-neutral-50 dark:bg-neutral-800 rounded space-y-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-2/3 animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Sidebar - Right side with video preview */}
          <div className="col-span-1 space-y-6">
            {/* Video Preview - Only for online courses */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-4">
              <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-4 animate-pulse"></div>
              <div className="relative bg-neutral-200 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-neutral-400 dark:bg-neutral-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Sidebar Skeleton */}
            <div className="sticky top-24 space-y-6">
              {/* Purchase Card Skeleton */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 md:p-6 rounded-sm">
                {/* Price Skeleton */}
                <div className="mb-6">
                  <div className="flex items-baseline space-x-3 mb-2">
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700 mb-3"></div>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-24 animate-pulse"></div>
                </div>

                {/* Course Info Skeleton */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
                  </div>
                </div>

                {/* Button Skeleton */}
                <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse"></div>
              </div>

              {/* Latest Courses Skeleton */}
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-sm">
                      <div className="w-12 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded mb-2"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Main Content - Below sidebar content */}
        <div className="block lg:hidden space-y-8 sm:space-y-12 mt-8 pb-24">
          {/* Course Info Skeleton */}
          <div className="space-y-12">
            {/* Tab Navigation Skeleton */}
            <div className="border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 flex-shrink-0">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-16 sm:w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Content Skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-11/12 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5 animate-pulse"></div>
              </div>

              {/* Highlights Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-3 sm:mb-4 animate-pulse"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Skeleton */}
            <div className="pt-6 sm:pt-8 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse mx-auto sm:mx-0"></div>
                <div className="flex-1 space-y-4 text-center sm:text-left">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 sm:w-1/3 mx-auto sm:mx-0 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 mx-auto sm:mx-0 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 animate-pulse"></div>
                        <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Sections Skeleton - Only for online courses */}
          <div className="space-y-6">
            <div className="text-left">
              <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-32 sm:w-40 animate-pulse mb-4"></div>
              <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700 mb-4 sm:mb-6"></div>
              <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-64 sm:w-80 animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden bg-white dark:bg-neutral-800">
                  <div className="p-4 sm:p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded-sm flex items-center justify-center animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-1/2 animate-pulse"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Card Skeleton */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-48 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* MyUNI Products Features Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 sm:p-8 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded flex-1 animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Certificate Skeleton */}
          <div className="p-6 sm:p-8 bg-neutral-50 dark:bg-neutral-800 rounded space-y-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-2/3 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className="mt-12 sm:mt-16">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-4 sm:mb-6 animate-pulse"></div>
            <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-48 sm:w-64 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-72 sm:w-96 mx-auto animate-pulse"></div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-3/4 animate-pulse"></div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse ml-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Skeleton */}
        <div className="mt-12 sm:mt-16">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto mb-4 sm:mb-6 animate-pulse"></div>
            <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-56 sm:w-72 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-64 sm:w-80 mx-auto animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 sm:w-20 animate-pulse"></div>
                    <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-12 sm:w-16 animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Button Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 lg:hidden z-50">
        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse"></div>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mx-auto mt-2 animate-pulse"></div>
      </div>
    </div>
  );
};

export default CourseLoadingSkeleton;