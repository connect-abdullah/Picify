document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.like-btn').forEach(button => {
      button.addEventListener('click', function() {
        const postId = this.getAttribute('data-id');
  
        fetch(`/feed/like/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to like post');
          return response.json();
        })
        .then(data => {
          this.querySelector('span').textContent = data.likesCount;
          this.classList.toggle('liked', data.liked);
        })
        .catch(error => console.error('Error:', error));
      });
    });
  });
  