// components/CourseLoadingSkeleton.tsx
"use client";

import React from 'react';

const CourseLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation Skeleton */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 lg:py-12">
        {/* Hero Video Skeleton */}
        <div className="relative h-64 sm:h-80 lg:h-96 mb-8 lg:mb-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-400 dark:bg-neutral-600 rounded-full"></div>
            </div>
          </div>
          
          {/* Video Info Skeleton */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 space-y-2">
            <div className="w-16 h-5 sm:w-20 sm:h-6 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
            <div className="w-12 h-5 sm:w-16 sm:h-6 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
          </div>
          
          {/* Floating Cards Skeleton - Hidden on mobile */}
          <div className="absolute bottom-4 right-4 space-y-3 hidden sm:block">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-28 h-12 sm:w-32 sm:h-16 bg-neutral-300 dark:bg-neutral-700 rounded-lg"></div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8 lg:space-y-12">
            {/* Course Info Skeleton */}
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-4">
                <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-full sm:w-3/4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/6 animate-pulse"></div>
                </div>
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-2">
                    <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-8 sm:w-12 mx-auto sm:mx-0 animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-12 sm:w-16 mx-auto sm:mx-0 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

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

            {/* Course Sections Skeleton */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32 sm:w-40 animate-pulse"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-16 sm:w-20 animate-pulse"></div>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="p-4 sm:p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full sm:w-1/2 animate-pulse"></div>
                          <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 sm:w-1/3 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features Skeleton */}
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

          {/* Sidebar Skeleton */}
          <div className="space-y-6 lg:space-y-8">
            {/* Purchase Card Skeleton */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
              {/* Price Header Skeleton */}
              <div className="p-4 sm:p-6 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16 sm:w-20 animate-pulse"></div>
                    <div className="h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-12 sm:w-16 animate-pulse"></div>
                  </div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 sm:w-24 mx-auto animate-pulse"></div>
                </div>
              </div>

              {/* Tab Navigation Skeleton */}
              <div className="flex border-b border-neutral-100 dark:border-neutral-700">
                <div className="flex-1 py-3 px-4">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                </div>
                <div className="flex-1 py-3 px-4">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto mb-1 animate-pulse"></div>
                      <div className="h-2 sm:h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 animate-pulse"></div>
                      <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button Skeleton */}
              <div className="p-4 sm:p-6 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <div className="h-10 sm:h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Additional Cards Skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 sm:w-24 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section Skeleton */}
        <div className="mt-12 lg:mt-16 space-y-6 lg:space-y-8">
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
        <div className="mt-12 lg:mt-16 space-y-6 lg:space-y-8">
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
    </div>
  );
};

export default CourseLoadingSkeleton;