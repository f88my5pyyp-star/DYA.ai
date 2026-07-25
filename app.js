// Smooth Launch Screen Fade Out after 2 seconds
window.addEventListener('load', () => {
  setTimeout(() => {
    const launchScreen = document.getElementById('launchScreen');
    if (launchScreen) {
      launchScreen.style.opacity = '0';
      setTimeout(() => {
        launchScreen.remove();
      }, 800); // Matches the fade transition time
    }
  }, 2000);
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

const drawingInput = document.getElementById('drawingInput');
const galleryGrid = document.getElementById('galleryGrid');

// Load saved drawings on startup
document.addEventListener('DOMContentLoaded', loadGallery);

// When a new image is selected/uploaded with auto-compression
drawingInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function() {
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        saveDrawing(compressedBase64);
        drawingInput.value = '';
      };
    };
    reader.readAsDataURL(file);
  }
});

// Save Drawing Locally
function saveDrawing(original, aiVersion = null) {
  try {
    const drawings = JSON.parse(localStorage.getItem('kidDrawings') || '[]');
    const newDrawing = {
      id: Date.now() + Math.random(),
      original,
      aiVersion,
      date: new Date().toLocaleDateString()
    };
    
    drawings.unshift(newDrawing);
    localStorage.setItem('kidDrawings', JSON.stringify(drawings));
    loadGallery();
  } catch (error) {
    alert("Storage is full! Try clearing some older drawings.");
  }
}

// Load and Render Gallery
function loadGallery() {
  galleryGrid.innerHTML = '';
  const drawings = JSON.parse(localStorage.getItem('kidDrawings') || '[]');
  
  if (drawings.length === 0) {
    galleryGrid.innerHTML = '<p style="color: #777; grid-column: 1 / -1; text-align: center; font-size: 16px;">No drawings saved yet. Upload your first one!</p>';
    return;
  }

  drawings.forEach(item => {
    const card = document.createElement('div');
    card.className = 'art-card';
    card.style.cssText = 'background: white; padding: 15px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px;';
    
    const displayImage = item.aiVersion || item.original;

    card.innerHTML = `
      <img src="${displayImage}" alt="Drawing" onclick="openLightbox('${displayImage}')" style="width: 100%; height: 160px; object-fit: cover; border-radius: 12px; cursor: pointer;" title="Click to view full screen">
      
      <div style="font-size: 12px; color: #666; display: flex; justify-content: space-between; align-items: center;">
        <span>📅 ${item.date}</span>
        ${item.aiVersion ? '<span style="background: #FF9800; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">AI Transform ✨</span>' : ''}
      </div>

      <!-- Action Buttons Row -->
      <div style="display: flex; gap: 8px;">
        <a href="${displayImage}" download="DYA-ai-transform-${item.id}.jpg" style="flex: 1; text-align: center; background: #2196F3; color: white; padding: 8px; border-radius: 8px; font-size: 12px; text-decoration: none; font-weight: bold;">📥 Download</a>
        <button onclick='shareImage(${JSON.stringify(displayImage)})' style="flex: 1; background: #E91E63; color: white; border: none; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer;">🔗 Share Socials</button>
      </div>

      <!-- ONLY show AI Transform button if item.aiVersion is falsy/empty -->
      ${!item.aiVersion ? `
        <button id="btn-${item.id}" onclick="generateAiForDrawing(${item.id})" style="width: 100%; background: linear-gradient(135deg, #FF9800, #FF5722); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 10px rgba(255, 152, 0, 0.3);">
          ✨ AI Transform
        </button>` : ''}
    `;
    galleryGrid.appendChild(card);
  });
};

// Social Share Selection Modal Popup
window.shareImage = function(imageSrc) {
  let modal = document.getElementById('shareModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; align-items: center;
      justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box;
    `;
    document.body.appendChild(modal);
  }

  const encodedUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Check out this amazing artwork transformed with DYA.ai! ✨");

  modal.innerHTML = `
    <div style="background: white; padding: 25px; border-radius: 20px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
      <h3 style="margin-top: 0; font-family: 'DynaPuff', cursive; color: #333;">Share Masterpiece</h3>
      <p style="font-size: 13px; color: #666; margin-bottom: 20px;">Post directly to your favorite platform:</p>
      
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a href="https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}" target="_blank" style="background: #25D366; color: white; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: bold; font-family: sans-serif; display: block;">💬 Share on WhatsApp</a>
        <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}" target="_blank" style="background: #1DA1F2; color: white; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: bold; font-family: sans-serif; display: block;">🐦 Share on X (Twitter)</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" style="background: #1877F2; color: white; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: bold; font-family: sans-serif; display: block;">📘 Share on Facebook</a>
        <button onclick="navigator.clipboard.writeText('${imageSrc}'); alert('Image link/data copied to clipboard!');" style="background: #6c757d; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; cursor: pointer; font-family: sans-serif; width: 100%;">📋 Copy Image Data</button>
      </div>

      <button onclick="closeShareModal()" style="margin-top: 20px; background: #ff4081; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: sans-serif;">❌ Close</button>
    </div>
  `;
  modal.style.display = 'flex';
  modal.onclick = closeShareModal;
};

window.closeShareModal = function() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Advanced Background Removal & Isolated Stroke Transformation Algorithm
window.generateAiForDrawing = function(id) {
  const drawings = JSON.parse(localStorage.getItem('kidDrawings') || '[]');
  const drawingIndex = drawings.findIndex(d => d.id === id);

  if (drawingIndex === -1) return;

  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Transforming... ✨";
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = drawings[drawingIndex].original;

  img.onload = function() {
    const width = img.width;
    const height = img.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Pristine white paper background layer
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. Extract original pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);

    const imgData = tempCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 3. Remove background and isolate strokes
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      let brightness = (r + g + b) / 3;

      if (brightness > 200) {
        data[i + 3] = 0; // Transparent background
      } else {
        let maxChannel = Math.max(r, g, b);
        let minChannel = Math.min(r, g, b);
        let chroma = maxChannel - minChannel;

        if (chroma > 15) {
          r = Math.min(255, r * 1.3);
          g = Math.min(255, g * 1.3);
          b = Math.min(255, b * 1.3);
        } else {
          r = Math.max(0, r * 0.7);
          g = Math.max(0, g * 0.7);
          b = Math.max(0, b * 0.7);
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = width;
    strokeCanvas.height = height;
    strokeCanvas.getContext('2d').putImageData(imgData, 0, 0);

    // 4. Draw isolated artwork onto white paper
    ctx.drawImage(strokeCanvas, 0, 0);

    const finalBase64 = canvas.toDataURL('image/jpeg', 0.9);
    drawings[drawingIndex].aiVersion = finalBase64;
    localStorage.setItem('kidDrawings', JSON.stringify(drawings));
    loadGallery();
  };

  img.onerror = function() {
    alert("Could not process this image. Try a different file!");
    if (btn) {
      btn.innerText = "✨ AI Transform";
      btn.disabled = false;
    }
  };
};

// Full Screen Lightbox Modal Functionality
window.openLightbox = function(imageSrc) {
  let modal = document.getElementById('lightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'lightboxModal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; align-items: center;
      justify-content: center; z-index: 1000; cursor: pointer; padding: 20px; box-sizing: border-box;
    `;
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="position: relative; max-width: 90%; max-height: 90%; text-align: center;" onclick="event.stopPropagation()">
      <img src="${imageSrc}" style="max-width: 100%; max-height: 80vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="margin-top: 15px; display: flex; justify-content: center; gap: 15px;">
        <a href="${imageSrc}" download="DYA-ai-transform.jpg" style="background: #2196F3; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-family: inherit;">📥 Download Full Size</a>
        <button onclick='shareImage(${JSON.stringify(imageSrc)})' style="background: #E91E63; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">🔗 Share Socials</button>
        <button onclick="closeLightbox()" style="background: #ff4081; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: inherit;">❌ Close</button>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  modal.onclick = closeLightbox;
};

window.closeLightbox = function() {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.style.display = 'none';
  }
};