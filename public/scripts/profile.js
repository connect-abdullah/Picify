document.addEventListener("DOMContentLoaded", () => {
  // Attach event listeners to the delete buttons
  const deleteBtns = document.querySelectorAll(".delete-btn");
  
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      const postId = event.target.dataset.postId;

      try {
        const response = await fetch(`/profile/delete/${postId}`, {
          method: "POST", // Use POST method to send the request
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          window.location.reload(); // Reload the page to reflect the deletion
        } else {
          alert("Failed to delete the post.");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("An error occurred while deleting the post.");
      }
    });
  });
});
