"use client";

// This file initializes Crisp with default settings
// It should be loaded before Crisp itself initializes

const CrispCustomization = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Initialize Crisp configuration array
          window.$crisp = [];
          
          // Set a timeout to ensure proper positioning
          setTimeout(function() {
            // Add CSS to ensure proper alignment with BackToTop button
            const style = document.createElement('style');
            style.innerHTML = \`
              /* Ensure Crisp is perfectly aligned with BackToTop button */
              .crisp-client .cc-1m7s,
              .crisp-client .cc-7oux {
                bottom: 16px !important;
                right: 16px !important;
              }
              
              /* Target the chat button specifically to center it */
              .crisp-client .cc-1m7s .cc-kegn {
                transform: translateX(-8px) !important;
              }
              
              /* Also adjust expanded chat window position */
              .crisp-client .cc-1s3d {
                right: 16px !important;
                transform: translateX(-8px) !important;
              }
            \`;
            document.head.appendChild(style);
          }, 1000);
        `
      }}
    />
  );
};

export default CrispCustomization;
