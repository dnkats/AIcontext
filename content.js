(function() {
  // Platform-specific selectors for common AI assistants
  const platformSelectors = {
    'claude.ai': {
      input: [
        // More comprehensive selectors for Claude
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="message"]',
        'div[role="textbox"]',
        'div[contenteditable="true"]',
        // Additional Claude-specific selectors
        'div[class*="promptTextarea"]',
        'div.text-input-with-header__input textarea',
        'div[class*="ChatMessageInputFooter"] textarea',
        'div[class*="ProseMirror"]'
      ],
      prefix: "Context: ",
      displayName: "Claude"
    },
    'anthropic.com': {
      input: [
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="message"]',
        'div[role="textbox"]',
        'div[contenteditable="true"]',
        'div[class*="promptTextarea"]',
        'div.text-input-with-header__input textarea'
      ],
      prefix: "Context: ",
      displayName: "Claude"
    },
    'chat.openai.com': {
      input: [
        'textarea[placeholder*="Send a message"]',
        'div[role="textbox"]',
        'textarea[data-id="root"]'
      ],
      prefix: "Context: ",
      displayName: "ChatGPT"
    },
    'chatgpt.com': {
      input: [
        // Updated and expanded selectors for ChatGPT.com
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="Send"]',
        '.ProseMirror[contenteditable="true"]',
        'div[role="textbox"]',
        'div[contenteditable="true"][class*="chat"]',
        'textarea[data-id="root"]'
      ],
      prefix: "Context: ",
      displayName: "ChatGPT"
    },
    'openai.com': {
      input: [
        'textarea[placeholder*="Send a message"]',
        'div[role="textbox"]',
        'textarea[data-id="root"]'
      ],
      prefix: "Context: ",
      displayName: "ChatGPT"
    },
    'gemini.google.com': {
      input: [
        'textarea[placeholder*="Enter text here"]',
        'div[contenteditable="true"]'
      ],
      prefix: "Context: ",
      displayName: "Gemini"
    },
    'bard.google.com': {
      input: [
        'textarea[placeholder*="Ask anything"]',
        'div[contenteditable="true"]'
      ],
      prefix: "Context: ",
      displayName: "Bard"
    },
    'perplexity.ai': {
      input: [
        'textarea[placeholder*="Ask anything"]',
        'div[role="textbox"]'
      ],
      prefix: "Context: ",
      displayName: "Perplexity"
    },
    'bing.com': {
      input: [
        'textarea[placeholder*="Ask me anything"]',
        'div[contenteditable="true"]'
      ],
      prefix: "Context: ",
      displayName: "Bing Chat"
    },
    'copilot.microsoft.com': {
      input: [
        'textarea[placeholder*="Message Copilot"]', 
        'textarea[placeholder*="message"]',
        'textarea[aria-label*="Message"]',
        'textarea[aria-label*="Copilot"]',
        '.cib-serp-main textarea',
        '.cib-text-input textarea',
        '.___textarea___',
        'div[role="textbox"]',
        'div[contenteditable="true"]'
      ],
      prefix: "Context: ",
      displayName: "Microsoft Copilot"
    },
    'default': {
      input: [
        'textarea',
        'div[role="textbox"]',
        'div[contenteditable="true"]',
        '[aria-label*="chat"]',
        '[aria-label*="message"]'
      ],
      prefix: "Context: ",
      displayName: "Unknown AI"
    }
  };

  // Function to detect current platform
  function detectPlatform() {
    const hostname = window.location.hostname;
    
    let platform = 'default';
    let displayName = 'Unknown AI';
    
    for (const key of Object.keys(platformSelectors)) {
      if (hostname.includes(key)) {
        platform = key;
        displayName = platformSelectors[key].displayName;
        break;
      }
    }
    
    return {
      platform,
      displayName
    };
  }

  // Helper function to find Claude input with retry
  function findClaudeInput() {
    const selectors = platformSelectors['claude.ai'].input;
    let textarea = null;
    
    // Try all selectors
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // For Claude, the relevant textarea is usually the last one
        textarea = elements[elements.length - 1];
        console.log(`Found Claude input using selector: ${selector}`);
        return textarea;
      }
    }
    
    // Try finding by aria attributes
    const ariaElements = document.querySelectorAll('[aria-label*="message"], [aria-label*="Message"], [aria-label*="chat"], [aria-label*="Chat"]');
    if (ariaElements.length > 0) {
      return ariaElements[ariaElements.length - 1];
    }
    
    return null;
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle detectPlatform request
    if (request.action === "detectPlatform") {
      const platformInfo = detectPlatform();
      sendResponse(platformInfo);
      return true;
    }
    
    // Handle addContext request
    if (request.action === "addContext") {
      try {
        const platformInfo = detectPlatform();
        console.log(`Detected platform: ${platformInfo.platform}`);
        
        let textarea = null;
        
        // Special handling for Claude.ai
        if (platformInfo.platform === 'claude.ai' || platformInfo.platform === 'anthropic.com') {
          // Try immediate find
          textarea = findClaudeInput();
          
          // If not found, try with a slight delay to ensure UI is loaded
          if (!textarea) {
            console.log("Claude input not found immediately, trying with delay...");
            setTimeout(function() {
              textarea = findClaudeInput();
              
              if (textarea) {
                processTextarea(textarea, request.context, platformInfo, sendResponse);
              } else {
                console.error("Could not find Claude input element even after delay");
                sendResponse({ success: false, message: "Could not find Claude input element" });
              }
            }, 500);
            return true;
          }
        } else {
          // Normal handling for other platforms
          const selectors = platformSelectors[platformInfo.platform] || platformSelectors.default;
          
          // Try to find the input element using platform-specific selectors
          for (const selector of selectors.input) {
            textarea = document.querySelector(selector);
            if (textarea) break;
            
            const possibleInputs = document.querySelectorAll(selector);
            if (possibleInputs.length > 0) {
              textarea = possibleInputs[possibleInputs.length - 1];
              break;
            }
          }
          
          // Special handling for ChatGPT.com and Microsoft Copilot
          if (!textarea && (platformInfo.platform === 'chatgpt.com' || platformInfo.platform === 'copilot.microsoft.com')) {
            // Try to find the input within all shadow roots
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
              if (element.shadowRoot) {
                for (const selector of selectors.input) {
                  const shadowInput = element.shadowRoot.querySelector(selector);
                  if (shadowInput) {
                    textarea = shadowInput;
                    console.log('Found input in shadow DOM');
                    break;
                  }
                }
                if (textarea) break;
              }
            }
          }
          
          // Fallback methods
          if (!textarea) {
            console.log('Using fallback selector approaches');
            // If we can't find the textarea, look for a div that might contain it
            const possibleContainers = document.querySelectorAll('div[role="textbox"], div.textbox, div.input-area, form');
            for (const container of possibleContainers) {
              const textareaInContainer = container.querySelector('textarea');
              if (textareaInContainer) {
                textarea = textareaInContainer;
                break;
              }
            }
          }
          
          // If we still can't find the textarea, try to find it by its position or other attributes
          if (!textarea) {
            const allTextareas = document.querySelectorAll('textarea');
            if (allTextareas.length > 0) {
              // Assume the last textarea is the input area
              textarea = allTextareas[allTextareas.length - 1];
              console.log('Using last textarea as fallback');
            }
          }
        }
        
        if (textarea) {
          processTextarea(textarea, request.context, platformInfo, sendResponse);
        } else {
          console.error("Could not find chat input element");
          sendResponse({ success: false, message: "Could not find chat input element" });
        }
      } catch (error) {
        console.error("Error adding context:", error);
        sendResponse({ success: false, message: error.message });
      }
    }
    return true;
  });
  
  // Function to process textarea once found
  function processTextarea(textarea, contextText, platformInfo, sendResponse) {
    try {
      console.log(`Found input element of type: ${textarea.tagName}`);
      
      // Get the current value - handle both textarea and contenteditable elements
      let currentValue = '';
      if (textarea.tagName === 'TEXTAREA') {
        currentValue = textarea.value;
      } else if (textarea.getAttribute('contenteditable') === 'true') {
        currentValue = textarea.innerText;
      } else if (textarea.getAttribute('role') === 'textbox') {
        currentValue = textarea.innerText;
      }
      
      // Get the appropriate prefix
      const selectors = platformSelectors[platformInfo.platform] || platformSelectors.default;
      const contextPrefix = selectors.prefix || "Context: ";
      
      // Create a new value with the context
      const newValue = currentValue 
        ? `${contextPrefix}${contextText}\n\n${currentValue}`
        : `${contextPrefix}${contextText}`;
      
      console.log(`Setting new value with length: ${newValue.length}`);
      
      // Set the new value - handle both textarea and contenteditable elements
      if (textarea.tagName === 'TEXTAREA') {
        textarea.value = newValue;
      } else if (textarea.getAttribute('contenteditable') === 'true') {
        textarea.innerText = newValue;
      } else if (textarea.getAttribute('role') === 'textbox') {
        textarea.innerText = newValue;
      }
      
      // Special event handling for different platforms
      if (platformInfo.platform === 'claude.ai' || platformInfo.platform === 'anthropic.com') {
        // Claude needs detailed event simulation
        const events = ['input', 'change', 'focus', 'keydown', 'keyup'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          textarea.dispatchEvent(event);
        });
        
        // For Claude, sometimes we need to trigger the input event again after a short delay
        setTimeout(() => {
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }, 100);
      } else if (platformInfo.platform === 'chatgpt.com') {
        // ChatGPT event handling
        const events = ['input', 'change', 'keydown', 'keyup', 'focus'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true });
          textarea.dispatchEvent(event);
        });
      } else {
        // Standard event triggering for other platforms
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        textarea.dispatchEvent(changeEvent);
      }
      
      // Focus the textarea
      textarea.focus();
      
      // Position cursor at the end
      if (textarea.tagName === 'TEXTAREA') {
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      } else {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(textarea);
        range.collapse(false); // collapse to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      console.log('Context added successfully');
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error processing textarea:", error);
      sendResponse({ success: false, message: error.message });
    }
  }
})();
