document.addEventListener('DOMContentLoaded', function() {
  const contextTextarea = document.getElementById('contextText');
  const addContextBtn = document.getElementById('addContextBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const saveTemplateForm = document.getElementById('saveTemplateForm');
  const templateTitle = document.getElementById('templateTitle');
  const confirmSaveBtn = document.getElementById('confirmSaveBtn');
  const cancelSaveBtn = document.getElementById('cancelSaveBtn');
  const templatesContainer = document.getElementById('templatesContainer');
  const statusMessage = document.getElementById('statusMessage');
  const platformIndicator = document.getElementById('platformIndicator');
  
  // Load saved templates when popup opens
  loadTemplates();
  
  // Detect current AI platform
  detectCurrentPlatform();
  
  // Add context to chat
  addContextBtn.addEventListener('click', function() {
    const contextText = contextTextarea.value.trim();
    if (contextText) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "addContext",
          context: contextText
        }, function(response) {
          if (response && response.success) {
            showStatus("Context added successfully!");
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            showStatus("Error: Could not add context. Make sure you're on a supported AI chat page.", "error");
          }
        });
      });
    } else {
      showStatus("Please enter some context text.", "error");
    }
  });
  
  // Show save template form
  saveTemplateBtn.addEventListener('click', function() {
    if (contextTextarea.value.trim()) {
      saveTemplateForm.style.display = 'block';
      templateTitle.focus();
    } else {
      showStatus("Please enter some context text first.", "error");
    }
  });
  
  // Save template
  confirmSaveBtn.addEventListener('click', function() {
    const title = templateTitle.value.trim();
    const content = contextTextarea.value.trim();
    
    if (!title) {
      showStatus("Please enter a template name.", "error");
      return;
    }
    
    if (!content) {
      showStatus("Template content cannot be empty.", "error");
      return;
    }
    
    chrome.storage.local.get(['contextTemplates'], function(result) {
      const templates = result.contextTemplates || [];
      
      // Check if template with same name already exists
      const existingIndex = templates.findIndex(t => t.title === title);
      if (existingIndex >= 0) {
        templates[existingIndex] = { title, content };
      } else {
        templates.push({ title, content });
      }
      
      chrome.storage.local.set({ contextTemplates: templates }, function() {
        saveTemplateForm.style.display = 'none';
        templateTitle.value = '';
        showStatus("Template saved!");
        loadTemplates();
      });
    });
  });
  
  // Cancel saving template
  cancelSaveBtn.addEventListener('click', function() {
    saveTemplateForm.style.display = 'none';
    templateTitle.value = '';
  });
  
  // Load saved templates
  function loadTemplates() {
    chrome.storage.local.get(['contextTemplates'], function(result) {
      const templates = result.contextTemplates || [];
      templatesContainer.innerHTML = '';
      
      if (templates.length === 0) {
        templatesContainer.innerHTML = '<p>No saved templates yet.</p>';
        return;
      }
      
      templates.forEach(function(template, index) {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-container';
        
        const headerElement = document.createElement('div');
        headerElement.className = 'template-header';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'template-title';
        titleElement.textContent = template.title;
        
        const actionsElement = document.createElement('div');
        actionsElement.className = 'template-actions';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'secondary-button';
        editBtn.addEventListener('click', function() {
          contextTextarea.value = template.content;
          templateTitle.value = template.title;
          saveTemplateForm.style.display = 'block';
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'secondary-button';
        deleteBtn.addEventListener('click', function() {
          if (confirm(`Are you sure you want to delete the template "${template.title}"?`)) {
            deleteTemplate(index);
          }
        });
        
        actionsElement.appendChild(editBtn);
        actionsElement.appendChild(deleteBtn);
        
        headerElement.appendChild(titleElement);
        headerElement.appendChild(actionsElement);
        
        const contentPreviewElement = document.createElement('div');
        contentPreviewElement.className = 'template-content';
        contentPreviewElement.textContent = template.content.length > 100 ? 
          template.content.substring(0, 100) + '...' : 
          template.content;
        contentPreviewElement.addEventListener('click', function() {
          contextTextarea.value = template.content;
        });
        
        templateElement.appendChild(headerElement);
        templateElement.appendChild(contentPreviewElement);
        
        templatesContainer.appendChild(templateElement);
      });
    });
  }
  
  // Delete template
  function deleteTemplate(index) {
    chrome.storage.local.get(['contextTemplates'], function(result) {
      const templates = result.contextTemplates || [];
      templates.splice(index, 1);
      
      chrome.storage.local.set({ contextTemplates: templates }, function() {
        showStatus("Template deleted!");
        loadTemplates();
      });
    });
  }
  
  // Show status message
  function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.style.color = type === 'success' ? 'green' : 'red';
    
    setTimeout(function() {
      statusMessage.textContent = '';
    }, 3000);
  }
  
  // Detect current AI platform
  function detectCurrentPlatform() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "detectPlatform" }, function(response) {
        if (response && response.platform) {
          platformIndicator.textContent = `Current Platform: ${response.platform}`;
        } else {
          platformIndicator.textContent = "Current Platform: Unknown";
        }
      });
    });
  }
});
