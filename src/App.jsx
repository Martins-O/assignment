import { useState, useEffect } from "react";
import abi from "./abi.json";
import { ethers } from "ethers";

const contractAddress = "0x9D1eb059977D71E1A21BdebD1F700d4A39744A70";

function App() {
  const [text, setText] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGetting, setIsGetting] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "error" // 'error' or 'success'
  });

  // Close snackbar after timeout
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  const showError = (error) => {
    let message = "An unknown error occurred";
    
    // Handle common Ethereum errors
    if (error.code === 4001) {
      message = "Transaction rejected by user";
    } else if (error.code === -32602) {
      message = "Invalid parameters";
    } else if (error.reason) {
      message = error.reason;
      // Clean up Solidity error messages
      message = message.replace("execution reverted: ", "");
    } else if (error.message) {
      message = error.message;
      // Clean up MetaMask errors
      message = message.replace("MetaMask Tx Signature: ", "");
    }

    setSnackbar({
      open: true,
      message,
      type: "error"
    });
  };

  const showSuccess = (message) => {
    setSnackbar({
      open: true,
      message,
      type: "success"
    });
  };

  const getMessage = async () => {
    if (!window.ethereum) {
      showError({ message: "MetaMask not detected. Please install MetaMask." });
      return;
    }

    try {
      setIsGetting(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const message = await contract.getMessage();
      setCurrentMessage(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      showError(error);
    } finally {
      setIsGetting(false);
    }
  };

  const handleSet = async () => {
    try {
      if (!text) {
        showError({ message: "Please enter a message before setting." });
        return;
      }

      if (window.ethereum) {
        setIsSetting(true);
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const tx = await contract.setMessage(text); 
        await tx.wait();
        await getMessage();
        setText("");
        showSuccess("Message successfully saved to blockchain!");
      } else {
        showError({ message: "MetaMask not found. Please install MetaMask." });
      }
    } catch (error) {
      console.error("Error setting message:", error);
      showError(error);
    } finally {
      setIsSetting(false);
    }
  };

  useEffect(() => {
    getMessage();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.header}>Blockchain Message Board</h1>
        
        <div style={styles.messageSection}>
          <div style={styles.messageDisplay}>
            {isGetting ? (
              <div style={styles.loading}>
                <div style={styles.spinner}></div>
                Loading message from blockchain...
              </div>
            ) : (
              <>
                <h3 style={styles.messageLabel}>Current Message:</h3>
                <div style={styles.messageText}>{currentMessage || "No message stored yet"}</div>
              </>
            )}
          </div>
          <button 
            onClick={getMessage} 
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...((isGetting || isSetting) && styles.disabledButton)
            }}
            disabled={isGetting || isSetting}
          >
            {isGetting ? "Refreshing..." : "Refresh Message"}
          </button>
        </div>

        <div style={styles.inputSection}>
          <h3 style={styles.subheader}>Set New Message</h3>
          <div style={styles.inputContainer}>
            <input
              type="text"
              placeholder="Type your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={styles.input}
              disabled={isSetting}
            />
            <button 
              onClick={handleSet} 
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...((isSetting || isGetting || !text) && styles.disabledButton)
              }}
              disabled={isSetting || isGetting || !text}
            >
              {isSetting ? "Saving to Blockchain..." : "Save Message"}
            </button>
          </div>
        </div>
      </div>

      {/* Snackbar Notification */}
      {snackbar.open && (
        <div style={{
          ...styles.snackbar,
          ...(snackbar.type === 'error' ? styles.snackbarError : styles.snackbarSuccess)
        }}>
          <div style={styles.snackbarContent}>
            {snackbar.type === 'error' ? (
              <svg style={styles.snackbarIcon} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
              </svg>
            ) : (
              <svg style={styles.snackbarIcon} viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
              </svg>
            )}
            <span>{snackbar.message}</span>
          </div>
          <button 
            onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
            style={styles.snackbarClose}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
    color: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '0',
    margin: '0',
    overflow: 'hidden'
  },
  content: {
    width: '90%',
    maxWidth: '800px',
    padding: '3rem',
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  header: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '2.5rem',
    textAlign: 'center',
    background: 'linear-gradient(90deg, #4299e1 0%, #38b2ac 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 10px rgba(66, 153, 225, 0.2)'
  },
  messageSection: {
    marginBottom: '3rem',
    padding: '2rem',
    backgroundColor: 'rgba(45, 55, 72, 0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(74, 85, 104, 0.3)'
  },
  messageDisplay: {
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  messageLabel: {
    fontSize: '1rem',
    color: '#a0aec0',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  messageText: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#ffffff',
    wordBreak: 'break-word',
    lineHeight: '1.4'
  },
  inputSection: {
    padding: '2rem',
    backgroundColor: 'rgba(45, 55, 72, 0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(74, 85, 104, 0.3)'
  },
  subheader: {
    fontSize: '1.2rem',
    marginBottom: '1.5rem',
    color: '#e2e8f0',
    fontWeight: '600'
  },
  inputContainer: {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column',
    '@media (min-width: 640px)': {
      flexDirection: 'row'
    }
  },
  input: {
    flex: 1,
    padding: '1rem',
    fontSize: '1rem',
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
    border: '1px solid #4a5568',
    borderRadius: '8px',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s ease',
    ':focus': {
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.3)'
    }
  },
  button: {
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '180px'
  },
  primaryButton: {
    background: 'linear-gradient(90deg, #4299e1 0%, #3182ce 100%)',
    color: 'white',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
    }
  },
  secondaryButton: {
    backgroundColor: 'rgba(74, 85, 104, 0.7)',
    color: '#e2e8f0',
    ':hover': {
      backgroundColor: 'rgba(74, 85, 104, 0.9)',
      transform: 'translateY(-2px)'
    }
  },
  disabledButton: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none !important',
    boxShadow: 'none !important'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#a0aec0',
    fontSize: '1rem'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(66, 153, 225, 0.2)',
    borderTop: '3px solid #4299e1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  snackbar: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '350px',
    width: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out',
    fontSize: '0.875rem'
  },
  snackbarError: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderLeft: '3px solid #dc2626'
  },
  snackbarSuccess: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    borderLeft: '3px solid #16a34a'
  },
  snackbarContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    flex: 1
  },
  snackbarMessage: {
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  snackbarIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0
  },
  snackbarClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '12px',
    color: 'inherit',
    opacity: '0.7',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: '1'
    }
  }
};

// Add global styles
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  input::placeholder {
    color: #718096;
    opacity: 1;
  }
`, styleSheet.cssRules.length);

export default App;