    document.addEventListener('DOMContentLoaded', () => {

        // --- Sticky Search Bar ---
        const header = document.querySelector('.header');
        const mainSearchContainer = document.querySelector('main > .search-container');
        if (header && mainSearchContainer) {
            const headerHeight = header.offsetHeight;
            mainSearchContainer.style.top = `${headerHeight}px`;
        }

        // --- Main Page Elements ---
        const appHeader = document.querySelector('.header');
        const appContainer = document.querySelector('.container');
        const appFooter = document.querySelector('.page-footer');

        const searchBar = document.getElementById('search-bar');
        const vegToggle = document.getElementById('veg-toggle');
        const catalogGrid = document.getElementById('catalog-items');

        // --- Item Detail Modal Elements ---
        const itemModalOverlay = document.getElementById('item-modal-overlay');
        const itemModalPanel = document.getElementById('item-modal-panel');
        const itemModalCloseBtn = document.getElementById('item-modal-close-btn');
        const modalImg = document.getElementById('modal-img');
        const modalVegIcon = document.getElementById('modal-veg-icon');
        const modalName = document.getElementById('modal-name');
        const modalDesc = document.getElementById('modal-desc');
        const modalPrice = document.getElementById('modal-price');
        const modalAddControl = document.getElementById('modal-add-control'); // <-- ADDED

        // --- Menu Modal Elements ---
        const menuFabBtn = document.getElementById('menu-fab-btn');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuPanel = document.getElementById('menu-panel');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        const menuCategoryLinks = document.querySelectorAll('.menu-category-link');

        // --- Search Page Elements ---
        const searchPage = document.getElementById('search-page');
        const searchPageInput = document.getElementById('search-page-input');
        const searchResultsList = document.getElementById('search-results-list');
        const searchBackBtn = document.getElementById('search-back-btn');

        // --- NEW: Cart Elements ---
        let cart = {}; // { "Item Name": { price: 260, quantity: 1 } }
        const headerCartBtn = document.getElementById('header-cart-btn');
        const headerCartCount = document.getElementById('header-cart-count');
        const cartModalOverlay = document.getElementById('cart-modal-overlay');
        const cartModalPanel = document.getElementById('cart-modal-panel');
        const cartModalCloseBtn = document.getElementById('cart-modal-close-btn');
        const cartItemsList = document.getElementById('cart-items-list');
        const cartTotalPrice = document.getElementById('cart-total-price');
        const placeOrderBtn = document.getElementById('place-order-btn');

        // --- NEW: Booking Modal Elements ---
        const bookingBtn = document.querySelector('.header-button'); // The "Book a Table" button
        const bookingModalOverlay = document.getElementById('booking-modal-overlay');
        const bookingModalPanel = document.getElementById('booking-modal-panel');
        const bookingModalCloseBtn = document.getElementById('booking-modal-close-btn');
        const bookingForm = document.getElementById('booking-form');


        // --- Main Page Filter Function ---
        function filterItems() {
            const searchTerm = searchBar.value.toLowerCase().trim();
            const isVegOnly = vegToggle.checked;

            const categoryHeaders = catalogGrid.querySelectorAll('.category-header');
            const itemCards = catalogGrid.querySelectorAll('.item-card');
            let itemsVisiblePerCategory = {};

            categoryHeaders.forEach(header => {
                itemsVisiblePerCategory[header.textContent] = 0;
            });

            itemCards.forEach(card => {
                const isVeg = card.dataset.veg === 'true';
                const vegMatch = !isVegOnly || isVeg;

                const itemName = card.querySelector('.item-name').textContent.toLowerCase();
                const itemDesc = card.querySelector('.item-desc').textContent.toLowerCase();
                const searchMatch = itemName.includes(searchTerm) || itemDesc.includes(searchTerm);

                let currentHeader = card.previousElementSibling;
                while (currentHeader && !currentHeader.classList.contains('category-header')) {
                    currentHeader = currentHeader.previousElementSibling;
                }
                const categoryName = currentHeader ? currentHeader.textContent : '';

                if (vegMatch && searchMatch) {
                    card.style.display = 'flex';
                    if (categoryName) {
                        itemsVisiblePerCategory[categoryName]++;
                    }
                } else {
                    card.style.display = 'none';
                }
            });

            categoryHeaders.forEach(header => {
                let nextEl = header.nextElementSibling;
                let hasItems = false;
                
                // Check if this category header is followed by any item cards at all
                while (nextEl && !nextEl.classList.contains('category-header')) {
                    if (nextEl.classList.contains('item-card')) {
                        hasItems = true;
                        break; 
                    }
                    nextEl = nextEl.nextElementSibling;
                }
                
                // Now use the visible count
                if (hasItems && itemsVisiblePerCategory[header.textContent] === 0) {
                    header.style.display = 'none'; // Hide header if all its items are filtered out
                } else if (!hasItems) {
                    header.style.display = 'none'; // Hide header if it had no items to begin with
                } else {
                    header.style.display = 'block'; // Show header
                }
            });

            if (window.innerWidth >= 768) {
                catalogGrid.style.display = 'grid';
            }
        }

        // --- NEW: Function to build the Add/Stepper inside the modal ---
        function updateModalAddControl(name, price) {
            // Clear old button/stepper
            modalAddControl.innerHTML = '';
            
            const currentQuantity = cart[name] ? cart[name].quantity : 0;
            const priceNum = parseFloat(price); // Ensure price is a number
            
            if (currentQuantity === 0) {
                // Show ADD button
                const addBtn = document.createElement('button');
                addBtn.className = 'add-btn';
                addBtn.textContent = 'ADD';
                addBtn.onclick = () => {
                    updateItemQuantity(name, priceNum, 1);
                };
                modalAddControl.appendChild(addBtn);
            } else {
                // Show stepper
                const stepper = document.createElement('div');
                stepper.className = 'quantity-stepper';
                
                const minusBtn = document.createElement('button');
                minusBtn.className = 'stepper-btn minus';
                minusBtn.setAttribute('aria-label', 'Decrease quantity');
                minusBtn.textContent = '-';
                minusBtn.onclick = () => {
                    updateItemQuantity(name, priceNum, currentQuantity - 1);
                };
                
                const quantitySpan = document.createElement('span');
                quantitySpan.className = 'quantity';
                quantitySpan.textContent = currentQuantity;
                
                const plusBtn = document.createElement('button');
                plusBtn.className = 'stepper-btn plus';
                plusBtn.setAttribute('aria-label', 'Increase quantity');
                plusBtn.textContent = '+';
                plusBtn.onclick = () => {
                    updateItemQuantity(name, priceNum, currentQuantity + 1);
                };
                
                stepper.appendChild(minusBtn);
                stepper.appendChild(quantitySpan);
                stepper.appendChild(plusBtn);
                modalAddControl.appendChild(stepper);
            }
        }


        // --- Item Detail Modal Functions ---
        function openItemModal(card) {
            const isVeg = card.dataset.veg === 'true';
            const name = card.dataset.name;
            const price = card.dataset.price; // Get price (as string)
            const imgSrc = card.dataset.imgSrc;
            const fullDesc = card.dataset.fullDesc;

            modalImg.src = imgSrc;
            modalImg.alt = name;
            modalName.textContent = name;
            modalDesc.textContent = fullDesc;
            modalPrice.textContent = `₹${parseFloat(price).toFixed(2)}`; // Format price

            // --- ADD/MODIFY THESE LINES ---
            // Store name and price on the modal panel itself
            itemModalPanel.dataset.name = name;
            itemModalPanel.dataset.price = price;

            // Build the Add/Stepper button
            updateModalAddControl(name, price);
            // --- END OF CHANGES ---

            if (isVeg) {
                modalVegIcon.className = 'ph-fill ph-square modal-veg-icon';
            } else {
                modalVegIcon.className = 'ph-fill ph-square modal-non-veg-icon';
            }

            itemModalOverlay.classList.add('modal-active');
            itemModalPanel.classList.add('modal-active');
            document.body.classList.add('no-scroll');
        }

    
        function closeItemModal() {
            itemModalOverlay.classList.remove('modal-active');
            itemModalPanel.classList.remove('modal-active');
            checkBodyScroll(); // Use shared function
        }

        // --- Menu Modal Functions ---
        function openMenuModal() {
            menuOverlay.classList.add('modal-active');
            menuPanel.classList.add('modal-active');
            document.body.classList.add('no-scroll');
        }

        function closeMenuModal() {
            menuOverlay.classList.remove('modal-active');
            menuPanel.classList.remove('modal-active');
            checkBodyScroll(); // Use shared function
        }

        // --- NEW: Booking Modal Functions ---
        function openBookingModal() {
            // Set min date for date input to today
            const dateInput = document.getElementById('book-date');
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const dd = String(today.getDate()).padStart(2, '0');
            dateInput.min = `${yyyy}-${mm}-${dd}`;
            dateInput.value = `${yyyy}-${mm}-${dd}`; // Default to today


            // Set min time
            const timeInput = document.getElementById('book-time');
            const hours = String(today.getHours()).padStart(2, '0');
            const minutes = String(today.getMinutes()).padStart(2, '0');
            timeInput.min = `${hours}:${minutes}`;
            timeInput.value = `${hours}:${minutes}`; // Default to current time


            bookingModalOverlay.classList.add('modal-active');
            bookingModalPanel.classList.add('modal-active');
            document.body.classList.add('no-scroll');
        }

        function closeBookingModal() {
            bookingModalOverlay.classList.remove('modal-active');
            bookingModalPanel.classList.remove('modal-active');
            checkBodyScroll(); // Use the shared function
        }

        // --- NEW: Shared function to check if body scroll should be enabled ---
        function checkBodyScroll() {
            if (!itemModalPanel.classList.contains('modal-active') &&
                !menuPanel.classList.contains('modal-active') &&
                !cartModalPanel.classList.contains('modal-active') &&
                !bookingModalPanel.classList.contains('modal-active'))
            {
                document.body.classList.remove('no-scroll');
            }
        }

        // --- Search Page Functions ---
        function openSearchPage() {
            appHeader.style.display = 'none';
            appContainer.style.display = 'none';
            appFooter.style.display = 'none';
            menuFabBtn.style.display = 'none';
            headerCartBtn.style.display = 'none'; // Hide header cart

            searchPage.style.display = 'flex';
            searchPageInput.value = searchBar.value;
            searchPageInput.focus();
            performSearch();
        }

        function closeSearchPage() {
            searchPage.style.display = 'none';
            appHeader.style.display = 'flex';
            appContainer.style.display = 'block';
            appFooter.style.display = 'block';
            menuFabBtn.style.display = 'flex';
            updateCartUI(); // This will correctly show/hide header cart

            searchResultsList.innerHTML = '';
        }

        function performSearch() {
            const searchTerm = searchPageInput.value.toLowerCase().trim();
            const isVegOnly = vegToggle.checked;

            searchResultsList.innerHTML = '';
            if (searchTerm.length === 0) {
                searchResultsList.innerHTML = `<p class="cart-empty-msg">Start typing to search...</p>`;
                return;
            }

            let resultsFound = 0;
            const allItemCards = catalogGrid.querySelectorAll('.item-card'); // Source of truth

            allItemCards.forEach(card => {
                const isVeg = card.dataset.veg === 'true';
                const vegMatch = !isVegOnly || isVeg;

                const itemName = card.dataset.name.toLowerCase();
                const itemDesc = card.querySelector('.item-desc').textContent.toLowerCase();
                const searchMatch = itemName.includes(searchTerm) || itemDesc.includes(searchTerm);

                if (vegMatch && searchMatch) {
                    const clonedCard = card.cloneNode(true);

                    // NEW: Sync the state of the cloned card with the cart
                    const itemName = clonedCard.dataset.name;
                    if (cart[itemName]) {
                        clonedCard.querySelector('.add-btn').style.display = 'none';
                        const stepper = clonedCard.querySelector('.quantity-stepper');
                        stepper.style.display = 'flex';
                        stepper.querySelector('.quantity').textContent = cart[itemName].quantity;
                    } else {
                        clonedCard.querySelector('.add-btn').style.display = 'block';
                        clonedCard.querySelector('.quantity-stepper').style.display = 'none';
                    }

                    searchResultsList.appendChild(clonedCard);
                    resultsFound++;
                }
            });

            if (resultsFound === 0) {
                searchResultsList.innerHTML = `<p class="cart-empty-msg">No items found for "${searchTerm}"</p>`;
            }
        }

        // --- NEW: Cart Functions (Updated) ---

        // NEW: Central function to add/update/remove items
        function updateItemQuantity(name, price, newQuantity) {
            if (newQuantity > 0) {
                cart[name] = {
                    price: price,
                    quantity: newQuantity
                };
            } else {
                delete cart[name]; // Remove from cart if quantity is 0 or less
            }

            updateCartUI();
        }

        function updateCartUI() {
            let totalQty = 0;
            let totalPrice = 0;

            cartItemsList.innerHTML = ''; // Clear the modal list

            const itemNamesInCart = Object.keys(cart);

            // 1. Update Cart Modal List
            if (itemNamesInCart.length === 0) {
                cartItemsList.innerHTML = '<p class="cart-empty-msg">Your cart is empty.</p>';
                placeOrderBtn.style.display = 'none';
            } else {
                itemNamesInCart.forEach(name => {
                    const item = cart[name];
                    totalQty += item.quantity;
                    totalPrice += item.price * item.quantity;

                    // Find original card to get veg/non-veg status
                    let isVeg = true; // Default to veg
                    const originalCard = document.querySelector(`.item-card[data-name="${CSS.escape(name)}"]`);
                    if (originalCard) {
                        isVeg = originalCard.dataset.veg === 'true';
                    }
                    const vegIconClass = isVeg ? 'item-veg-icon' : 'item-non-veg-icon';


                    // Create and add list item to modal
                    const cartItemHTML = `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <i class="ph-fill ph-square ${vegIconClass}" style="font-size: 0.9rem; margin-right: 4px;"></i>
                                <div class="cart-item-name">${name}</div>
                                <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                            </div>
                            <div class="quantity-stepper">
                                <button class="stepper-btn minus" data-name="${name}" aria-label="Decrease quantity">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="stepper-btn plus" data-name="${name}" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                    `;
                    cartItemsList.innerHTML += cartItemHTML;
                });
                placeOrderBtn.style.display = 'block';
            }

            // 2. Update Header Cart Icon
            headerCartCount.textContent = totalQty;
            if (totalQty > 0) {
                headerCartBtn.style.display = 'block';
            } else {
                headerCartBtn.style.display = 'none';
            }

            // 3. Update Total Price in Modal
            cartTotalPrice.textContent = `₹${totalPrice.toFixed(2)}`;

            // 4. Sync all item cards on the page (main list AND search list)
            document.querySelectorAll('.item-card').forEach(card => {
                const name = card.dataset.name;
                const addBtn = card.querySelector('.add-btn');
                const stepper = card.querySelector('.quantity-stepper');

                if (cart[name]) {
                    // Item is in cart
                    addBtn.style.display = 'none';
                    stepper.style.display = 'flex';
                    stepper.querySelector('.quantity').textContent = cart[name].quantity;
                } else {
                    // Item is not in cart
                    addBtn.style.display = 'block';
                    stepper.style.display = 'none';
                }
            });

            // --- ADDED: 5. Sync the item modal if it's open ---
            if (itemModalPanel.classList.contains('modal-active')) {
                const name = itemModalPanel.dataset.name;
                const price = itemModalPanel.dataset.price;
                if (name && price) {
                    updateModalAddControl(name, price);
                }
            }
        }

        function openCartModal() {
            cartModalOverlay.classList.add('modal-active');
            cartModalPanel.classList.add('modal-active');
            document.body.classList.add('no-scroll');
        }

        function closeCartModal() {
            cartModalOverlay.classList.remove('modal-active');
            cartModalPanel.classList.remove('modal-active');
            checkBodyScroll(); // Use shared function
        }

        function placeOrder() {
            closeCartModal();
            showToast("Your order has been sent to the kitchen");
            cart = {}; // Reset cart
            updateCartUI(); // Update all UI elements
        }

        function showToast(message) {
            // Check if a toast is already shown, remove it
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.textContent = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentElement) {
                        document.body.removeChild(toast);
                    }
                }, 500);
            }, 3000);
        }


        // --- Event Listeners ---

        // Main Page Filters
        searchBar.addEventListener('input', filterItems);
        vegToggle.addEventListener('change', filterItems);

        // --- Search Page Triggers ---
        searchBar.addEventListener('focus', openSearchPage);
        searchBackBtn.addEventListener('click', closeSearchPage);
        searchPageInput.addEventListener('input', performSearch);


        // --- NEW: Updated Click Handler for Cards ---
        function handleCardClick(e) {
            const card = e.target.closest('.item-card');
            if (!card) return;

            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const currentQuantity = cart[name] ? cart[name].quantity : 0;

            // 1. Check for Stepper PLUS click
            if (e.target.closest('.plus')) {
                e.stopPropagation();
                updateItemQuantity(name, price, currentQuantity + 1);
                return;
            }

            // 2. Check for Stepper MINUS click
            if (e.target.closest('.minus')) {
                e.stopPropagation();
                updateItemQuantity(name, price, currentQuantity - 1);
                return;
            }

            // 3. Check for "ADD" button click
            if (e.target.closest('.add-btn')) {
                e.stopPropagation();
                updateItemQuantity(name, price, 1); // Add first item
                return;
            }

            // 4. If none of those, open the detail modal
            // Check that the click is not on the add-control area itself
            if (!e.target.closest('.item-add-control')) {
                openItemModal(card);
            }
        }

        // Listen on both main grid and search results
        catalogGrid.addEventListener('click', handleCardClick);
        searchResultsList.addEventListener('click', handleCardClick);

        // --- NEW: Click handler for buttons INSIDE the cart modal ---
        cartItemsList.addEventListener('click', (e) => {
            const name = e.target.dataset.name;
            if (!name) return;

            const item = cart[name];
            if (!item) return;

            if (e.target.closest('.plus')) {
                updateItemQuantity(name, item.price, item.quantity + 1);
            } else if (e.target.closest('.minus')) {
                updateItemQuantity(name, item.price, item.quantity - 1);
            }
        });


        // Item Detail Modal close buttons
        itemModalCloseBtn.addEventListener('click', closeItemModal);
        itemModalOverlay.addEventListener('click', closeItemModal);

        // --- Menu Modal Listeners ---
        menuFabBtn.addEventListener('click', openMenuModal);
        menuCloseBtn.addEventListener('click', closeMenuModal);
        menuOverlay.addEventListener('click', closeMenuModal);

        menuCategoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stop immediate jump
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Calculate header heights to offset scroll
                    const headerHeight = header.offsetHeight;
                    const searchHeight = mainSearchContainer.offsetHeight;
                    const offset = headerHeight + searchHeight + 20; // 20px padding

                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
                closeMenuModal();
            });
        });

        // --- NEW: Booking Modal Listeners ---
        bookingBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop any default button behavior
            openBookingModal();
        });
        bookingModalCloseBtn.addEventListener('click', closeBookingModal);
        bookingModalOverlay.addEventListener('click', closeBookingModal);

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual form submission

            const name = document.getElementById('book-name').value;

            // 1. Close the modal
            closeBookingModal();

            // 2. Show a toast message
            showToast(`Thanks, ${name}! Your table is booked.`);

            // 3. Reset the form
            bookingForm.reset();
        });


        // --- NEW: Cart Modal Listeners ---
        headerCartBtn.addEventListener('click', openCartModal);
        cartModalCloseBtn.addEventListener('click', closeCartModal);
        cartModalOverlay.addEventListener('click', closeCartModal);
        placeOrderBtn.addEventListener('click', placeOrder);

        // --- Final Setup ---
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                catalogGrid.style.display = 'grid';
            } else {
                catalogGrid.style.display = 'block';
            }
        });

        // Run filter and cart UI on initial load
        filterItems();
        updateCartUI();

    });
