import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import LoginSignupPage from '../auth/LoginSignupPage';
import './customer-reviews copy.css';
import '../auth/loginsignup.css';

function CustomerReviews({ productId = 'morning-glory-smoothie' }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newReview, setNewReview] = useState({
    title: '',
    rating: 5,
    text: '',
    author: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isPhoneAuth, setIsPhoneAuth] = useState(false);

  // Fetch user data and determine authentication type
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let author = currentUser.displayName || '';
        const isPhone = currentUser.phoneNumber && !currentUser.email;
        setIsPhoneAuth(isPhone);

        // If no displayName and phone auth, try fetching from Firestore
        if (!author && isPhone) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              author = userDoc.data().name || currentUser.phoneNumber || '';
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        }

        setNewReview((prev) => ({
          ...prev,
          author: author,
          email: isPhone ? '' : (currentUser.email || ''),
        }));
      } else {
        setIsPhoneAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch reviews when productId changes
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const reviewsRef = collection(db, 'product_reviews');
      const q = query(reviewsRef, where('productId', '==', productId));
      const querySnapshot = await getDocs(q);
      let allReviews = [];
      let totalRating = 0;

      querySnapshot.forEach((doc) => {
        const reviewData = doc.data();
        const reviewWithId = {
          id: doc.id,
          ...reviewData,
          date: formatDate(reviewData.timestamp?.toDate() || new Date()),
        };
        allReviews.push(reviewWithId);
        totalRating += reviewData.rating || 0;
      });

      // Sort reviews by timestamp (newest first)
      allReviews.sort((a, b) => {
        const dateA = a.timestamp?.toDate() || new Date();
        const dateB = b.timestamp?.toDate() || new Date();
        return dateB - dateA;
      });

      // Limit to 10 reviews
      allReviews = allReviews.slice(0, 10);

      setReviews(allReviews);
      setTotalReviews(allReviews.length);
      setAverageRating(
        allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : 0
      );
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(`Failed to load reviews: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (!newReview.author) {
        setError('User name not found. Please update your profile.');
        return;
      }
      if (!isPhoneAuth && !newReview.email) {
        setError('User email not found. Please update your profile.');
        return;
      }

      const reviewData = {
        ...newReview,
        productId,
        rating: Number(newReview.rating),
        timestamp: serverTimestamp(),
        verified: !!user,
        userId: user?.uid || null,
        email: isPhoneAuth ? null : newReview.email,
      };

      await addDoc(collection(db, 'product_reviews'), reviewData);

      // Reset form
      setNewReview({
        title: '',
        rating: 5,
        text: '',
        author: user ? (user.displayName || (isPhoneAuth ? '' : user.phoneNumber) || '') : '',
        email: isPhoneAuth ? '' : (user?.email || ''),
      });
      setShowReviewForm(false);
      await fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(`Failed to submit review: ${err.message}`);
    }
  };

  const formatDate = (date) => {
    try {
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'recent';
    }
  };

  const handleWriteReview = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowReviewForm(true);
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="loading_Item_des">
        <div className="loading-spinner_Item_des"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error_Item_des">
        <p>{error}</p>
        <button className="retry-button_Item_des" onClick={fetchReviews}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="customer-reviews_Item_des">
      <div className="container_Item_des">
        <h2 className="section-title_Item_des">Customer Reviews</h2>
        <div className="reviews-header_Item_des">
          <div className="rating-summary_Item_des">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`star-icon_Item_des ${i < Math.round(averageRating) ? 'filled' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="rating-text_Item_des">
              {averageRating} out of 5 ({totalReviews} reviews)
            </span>
          </div>
          <button
            className="review-button_Item_des"
            onClick={handleWriteReview}
          >
            Write a Review
          </button>
        </div>

        {showLoginModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close_loginSignup" onClick={handleCloseModal}>×</button>
              <LoginSignupPage />
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="no-reviews_Item_des">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="reviews-list_Item_des">
            {reviews.map((review) => (
              <div key={review.id} className="review-card_Item_des">
                <div className="review-header_Item_des">
                  <div>
                    <div className="review-rating_Item_des">
                      {[...Array(5)].map((_, j) => (
                        <svg
                          key={j}
                          className={`star-icon_Item_des ${j < review.rating ? 'filled' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <h4 className="review-title_Item_des">{review.title}</h4>
                  </div>
                  <span className="review-date_Item_des">{review.date}</span>
                </div>
                <p className="review-text_Item_des">{review.text}</p>
                <div className="review-author_Item_des">
                  <div className="author-avatar_Item_des">{review.author[0]}</div>
                  <span className="author-name_Item_des">{review.author}</span>
                  {review.verified && (
                    <span className="verified-badge_Item_des">Verified Purchase</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showReviewForm && (
          <div className="review-form-container_Item_des">
            <form onSubmit={handleSubmitReview} className="review-form_Item_des">
              <div className="form-header_Item_des">
                <h3>Write a Review</h3>
                <button
                  type="button"
                  className="close-button_Item_des"
                  onClick={() => setShowReviewForm(false)}
                >
                  ×
                </button>
              </div>

              <div className="form-group_Item_des">
                <label>Rating</label>
                <div className="rating-input_Item_des">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`star-button_Item_des ${i < newReview.rating ? 'filled' : ''}`}
                      onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group_Item_des">
                <label>Title</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group_Item_des">
                <label>Review</label>
                <textarea
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  required
                />
              </div>

              <div className="form-actions_Item_des">
                <button type="submit" className="submit-button_Item_des">
                  Submit Review
                </button>
                <button
                  type="button"
                  className="cancel-button_Item_des"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

export default CustomerReviews;