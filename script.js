console.log("Media Player loaded successfully!");

// Initialize media player on page load
document.addEventListener('DOMContentLoaded', function() {
  initMediaPlayer();
  initDarkMode();
});

/* ===================== Dark Mode ===================== */
function initDarkMode() {
  const toggle = document.getElementById('darkModeSwitch');
  if (!toggle) return;

  // Restore saved preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    toggle.checked = true;
  }

  toggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
    localStorage.setItem('darkMode', this.checked);
  });
}

/* ===================== Media Player ===================== */

// List your media files here. Add entries when you drop files into assets/media/
const PROJECT_MEDIA = [
  { name: 'Skusta Clee - Since Day One (Lyrics) Ft. Flow G.mp3', url: 'assets/media/music/Skusta Clee - Since Day One (Lyrics) Ft. Flow G.mp3', type: 'audio' },
  // { name: 'My Song.mp3',   url: 'assets/media/music/My Song.mp3',   type: 'audio' },
  // { name: 'My Video.mp4',  url: 'assets/media/videos/My Video.mp4', type: 'video' },
];

function initMediaPlayer() {
  const audioPlayer = document.getElementById('audioPlayer');
  const videoPlayer = document.getElementById('videoPlayer');
  const audioContainer = document.getElementById('audioContainer');
  const videoContainer = document.getElementById('videoContainer');
  const audioControls = document.getElementById('audioControls');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const nowPlayingType = document.getElementById('nowPlayingType');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playIcon = document.getElementById('playIcon');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnShuffle = document.getElementById('btnShuffle');
  const btnRepeat = document.getElementById('btnRepeat');
  const audioProgress = document.getElementById('audioProgress');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const volumeSlider = document.getElementById('volumeSlider');
  const playlistList = document.getElementById('playlistList');
  const emptyPlaylist = document.getElementById('emptyPlaylist');
  const filterBtns = document.querySelectorAll('.media-filter-btn');
  const canvas = document.getElementById('audioVisualizer');

  if (!audioPlayer || !videoPlayer) return;

  let currentIndex = -1;
  let isShuffled = false;
  let repeatMode = 0;
  let currentFilter = 'all';
  let audioContext, analyser, source, animFrameId;

  function cleanName(filename) {
    return filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }

  const playlist = PROJECT_MEDIA.map(item => ({
    name: item.name,
    displayName: cleanName(item.name),
    type: item.type,
    url: item.url
  }));

  audioPlayer.volume = 0.8;
  videoPlayer.volume = 0.8;

  function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function renderPlaylist() {
    playlistList.innerHTML = '';
    const filtered = playlist.map((item, idx) => ({ ...item, idx })).filter(item => {
      if (currentFilter === 'all') return true;
      return item.type === currentFilter;
    });

    if (filtered.length === 0) {
      emptyPlaylist.classList.remove('d-none');
      playlistList.classList.add('d-none');
      return;
    }
    emptyPlaylist.classList.add('d-none');
    playlistList.classList.remove('d-none');

    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-group-item media-playlist-item' + (item.idx === currentIndex ? ' active' : '');
      li.innerHTML = `
        <div class="media-item-icon ${item.type === 'video' ? 'video-icon' : 'audio-icon'}">
          <i class="fas ${item.type === 'video' ? 'fa-film' : 'fa-music'}"></i>
        </div>
        <div class="media-item-info">
          <div class="media-item-name">${item.displayName}</div>
          <div class="media-item-type">${item.type} &bull; ${item.name.split('.').pop().toUpperCase()}</div>
        </div>
      `;
      li.addEventListener('click', () => playTrack(item.idx));
      playlistList.appendChild(li);
    });
  }

  function stopAll() {
    audioPlayer.pause();
    audioPlayer.src = '';
    videoPlayer.pause();
    videoPlayer.src = '';
    if (animFrameId) cancelAnimationFrame(animFrameId);
  }

  function playTrack(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    stopAll();
    currentIndex = idx;
    const track = playlist[idx];

    nowPlayingTitle.textContent = track.displayName;
    nowPlayingType.textContent = track.type.charAt(0).toUpperCase() + track.type.slice(1) + ' \u2014 ' + track.name.split('.').pop().toUpperCase();

    if (track.type === 'video') {
      audioContainer.classList.add('d-none');
      audioControls.classList.add('d-none');
      videoContainer.classList.remove('d-none');
      videoPlayer.src = track.url;
      videoPlayer.play();
    } else {
      videoContainer.classList.add('d-none');
      audioContainer.classList.remove('d-none');
      audioControls.classList.remove('d-none');
      audioPlayer.src = track.url;
      audioPlayer.play();
      playIcon.className = 'fas fa-pause';
      startVisualizer();
    }
    renderPlaylist();
  }

  btnPlayPause.addEventListener('click', function() {
    if (currentIndex === -1) return;
    if (playlist[currentIndex].type === 'audio') {
      if (audioPlayer.paused) { audioPlayer.play(); playIcon.className = 'fas fa-pause'; }
      else { audioPlayer.pause(); playIcon.className = 'fas fa-play'; }
    }
  });

  btnPrev.addEventListener('click', function() {
    if (playlist.length === 0) return;
    let idx = currentIndex - 1;
    if (idx < 0) idx = playlist.length - 1;
    playTrack(idx);
  });

  btnNext.addEventListener('click', function() { playNext(); });

  function playNext() {
    if (playlist.length === 0) return;
    if (isShuffled) {
      let idx = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1) while (idx === currentIndex) idx = Math.floor(Math.random() * playlist.length);
      playTrack(idx);
    } else {
      let idx = currentIndex + 1;
      if (idx >= playlist.length) idx = 0;
      playTrack(idx);
    }
  }

  btnShuffle.addEventListener('click', function() {
    isShuffled = !isShuffled;
    btnShuffle.classList.toggle('active', isShuffled);
  });

  btnRepeat.addEventListener('click', function() {
    repeatMode = (repeatMode + 1) % 3;
    btnRepeat.classList.toggle('active', repeatMode > 0);
    btnRepeat.innerHTML = repeatMode === 2
      ? '<i class="fas fa-redo"></i><small style="font-size:0.5rem;position:absolute;bottom:2px;">1</small>'
      : '<i class="fas fa-redo"></i>';
  });

  audioPlayer.addEventListener('timeupdate', function() {
    if (audioPlayer.duration) {
      audioProgress.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
      totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }
  });

  audioProgress.addEventListener('input', function() {
    if (audioPlayer.duration) audioPlayer.currentTime = (audioProgress.value / 100) * audioPlayer.duration;
  });

  volumeSlider.addEventListener('input', function() {
    const vol = volumeSlider.value / 100;
    audioPlayer.volume = vol;
    videoPlayer.volume = vol;
  });

  audioPlayer.addEventListener('ended', handleTrackEnd);
  videoPlayer.addEventListener('ended', handleTrackEnd);

  function handleTrackEnd() {
    if (repeatMode === 2) playTrack(currentIndex);
    else if (repeatMode === 1 || currentIndex < playlist.length - 1) playNext();
    else playIcon.className = 'fas fa-play';
  }

  videoPlayer.addEventListener('play', () => playIcon.className = 'fas fa-pause');
  videoPlayer.addEventListener('pause', () => playIcon.className = 'fas fa-play');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderPlaylist();
    });
  });

  function startVisualizer() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaElementSource(audioPlayer);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') audioContext.resume();
    } catch (e) { return; }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animFrameId = requestAnimationFrame(draw);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = (canvas.width / bufferLength) * 1.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barH = (dataArray[i] / 255) * canvas.height * 0.8;
        ctx.fillStyle = `rgba(${13 + i * 3},${110 - i * 1.5},253,0.7)`;
        ctx.fillRect(x, canvas.height - barH, barW - 1, barH);
        x += barW;
      }
    }
    draw();
  }

  // Auto-render playlist on load
  renderPlaylist();
}
