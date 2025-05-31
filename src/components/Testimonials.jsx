import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import './Testimonials.css';

// Fallback static data
const staticTestimonials = [
  {
    id: '1',
    rating: 5,
    title: "My Daily Energy Boost",
    text: "The Green Goddess smoothie has become my daily ritual. I've noticed a significant boost in my energy levels!",
    author: "Jane Doe",
    role: "Fitness Enthusiast",
    image: 'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Favatar.jpg?alt=media',
  },
  {
    id: '2',
    rating: 5,
    title: "Perfect for Fitness Goals",
    text: "As a fitness trainer, I recommend SlurpinSage to all my clients. Their protein-packed options are excellent!",
    author: "Mike Smith",
    role: "Personal Trainer",
    image: 'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Favatar.jpg?alt=media',
  },
  {
    id: '3',
    rating: 5,
    title: "Family Favorite",
    text: "I love that SlurpinSage uses all organic ingredients. My kids love the taste and nutrition!",
    author: "Amy Johnson",
    role: "Mother of Two",
    image: 'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Favatar.jpg?alt=media',
  },
  {
    id: '4',
    rating: 5,
    title: "Convenient and Rewarding",
    text: "The mobile ordering app is so convenient, and the rewards program is generous. Best smoothie shop in town!",
    author: "Robert Lee",
    role: "Tech Professional",
    image: 'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Favatar.jpg?alt=media',
  },
];

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  // Default avatar
  const DEFAULT_AVATAR_URL =
    'https://firebasestorage.googleapis.com/v0/b/slurpin-sage.appspot.com/o/default%2Favatar.jpg?alt=media';

  // Function to shuffle array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Fetch reviews and user data
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch reviews with rating >= 4
      const reviewsRef = collection(db, 'product_reviews');
      const q = query(
        reviewsRef,
        where('rating', '>=', 4),
        orderBy('rating', 'desc'),
        limit(12)
      );
      const querySnapshot = await getDocs(q);

      const fetchedReviews = [];
      for (const reviewDoc of querySnapshot.docs) {
        const data = reviewDoc.data();
        let author = data.author || 'Anonymous';
        let image = DEFAULT_AVATAR_URL;
        let title = data.title || 'Great Experience';

        // Fetch user data if userId exists
        if (data.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              author = userData.displayName || author;
              image = userData.photoURL || DEFAULT_AVATAR_URL;
            }
          } catch (userErr) {
            console.warn(`Failed to fetch user ${data.userId}:, userErr.message`);
          }
        }

        fetchedReviews.push({
          id: reviewDoc.id,
          rating: data.rating || 5,
          title: title,
          text: data.text || 'No review text available.',
          author,
          role: 'Customer',
          image,
        });
      }

      if (fetchedReviews.length === 0) {
        console.warn('No reviews found in product_reviews.');
        setReviews(staticTestimonials);
        setError('No reviews available. Showing default testimonials.');
      } else {
        // Shuffle the reviews before setting them
        setReviews(shuffleArray(fetchedReviews));
      }
    } catch (err) {
      console.error('Error fetching reviews:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      setError('Failed to load reviews. Showing default testimonials.');
      setReviews(staticTestimonials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex < 0 ? reviews.length - 4 : newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex > reviews.length - 4 ? 0 : newIndex;
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(<span key={i} className="star_testimonial">★</span>);
    }
    return <div className="rating">{stars}</div>;
  };

  const handleReviewClick = (review) => {
    setSelectedReview(review);
  };

  const handleClosePopup = () => {
    setSelectedReview(null);
  };

  if (loading) {
    return (
      <section className="testimonial-section">
        <div className="loading">Loading reviews...</div>
      </section>
    );
  }

  // Get current set of reviews to display
  const visibleReviews = reviews.slice(currentIndex, currentIndex + 4);

  return (
    <section className="testimonial-section">
      <h2 className="testimonial-heading">
        Don't just take our word for it <span>Hear from our satisfied customers</span>
      </h2>

      {error && (
        <div className="error">
          {error}
          <button className="retry-button" onClick={fetchReviews}>
            Retry
          </button>
        </div>
      )}

      <div className="testimonial-carousel">
        <div className="testimonial-cards">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="testimonial-card"
            >
              {renderStars(review.rating)}
              <h3 className="testimonial-title">{review.title}</h3>
              <div className="testimonial-text-container">
                <p className="testimonial-text">{review.text}</p>
                {review.text.length > 150 && (
                  <button 
                    className="read-more-btn"
                    onClick={() => handleReviewClick(review)}
                  >
                    Read More
                  </button>
                )}
              </div>
              <div className="testimonial-author">
                <img
                  src={review.image}
                  alt={review.author}
                  className="author-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR_URL;
                  }}
                />
                <div className="author-info">
                  <p className="author-name">{review.author}</p>
                  <p className="author-role">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonial-nav-bottom">
          <button className="nav-button prev" onClick={handlePrevious}>
            ❮
          </button>
          <button className="nav-button next" onClick={handleNext}>
            ❯
          </button>
        </div>
      </div>

      {selectedReview && (
        <div className="review-popup-overlay" onClick={handleClosePopup}>
          <div className="review-popup" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={handleClosePopup}>×</button>
            <div className="popup-content">
              {renderStars(selectedReview.rating)}
              <h3 className="popup-title">{selectedReview.title || 'Great Experience'}</h3>
              <p className="popup-text">{selectedReview.text}</p>
              <div className="popup-author">
                <img
                  src={selectedReview.image}
                  alt={selectedReview.author}
                  className="popup-author-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR_URL;
                  }}
                />
                <div className="popup-author-info">
                  <p className="popup-author-name">{selectedReview.author}</p>
                  <p className="popup-author-role">{selectedReview.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonials;