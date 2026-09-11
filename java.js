const sidebar=document.getElementById('sidebar'),overlay=document.getElementById('overlay'),toast=document.getElementById('toast');
const auth=document.getElementById('authScreen'),form=document.getElementById('authForm'),authTitle=document.getElementById('authTitle'),authKicker=document.getElementById('authKicker'),authCopy=document.getElementById('authCopy'),authSubmit=document.getElementById('authSubmit'),authSwitch=document.getElementById('authSwitch');
const profileSetup=document.getElementById('profileSetup'),calorieGoalInput=document.createElement('input');calorieGoalInput.id='calorieGoalInput';calorieGoalInput.type='number';calorieGoalInput.min='800';calorieGoalInput.max='10000';calorieGoalInput.step='50';calorieGoalInput.value='2100';calorieGoalInput.placeholder='e.g. 2100';const calorieGoalLabel=document.createElement('label');calorieGoalLabel.textContent='How many calories would you like to eat each day?';calorieGoalLabel.append(calorieGoalInput);profileSetup.append(calorieGoalLabel);const profileQuestions=[document.getElementById('genderInput'),document.getElementById('gymDaysInput'),document.getElementById('mainGoalInput'),document.getElementById('dietInput')],profileCreationFields=[...profileQuestions,calorieGoalInput];
const profileSelectControls=[];
function closeProfileSelects(except){profileSelectControls.forEach(control=>{if(control!==except){control.wrapper.classList.remove('open');control.trigger.setAttribute('aria-expanded','false')}})}
function enhanceProfileSelect(select){
  const wrapper=document.createElement('div'),trigger=document.createElement('button'),options=document.createElement('div');
  wrapper.className='custom-select';
  trigger.type='button';
  trigger.className='custom-select-trigger';
  trigger.setAttribute('aria-haspopup','listbox');
  trigger.setAttribute('aria-expanded','false');
  options.className='custom-select-options';
  options.setAttribute('role','listbox');
  select.before(wrapper);
  wrapper.append(select,trigger,options);

  const scrollOptionsIntoView=()=>{
    if(window.innerWidth>760)return;
    requestAnimationFrame(()=>{
      const panelRect=auth.getBoundingClientRect();
      const triggerRect=trigger.getBoundingClientRect();
      const optionsRect=options.getBoundingClientRect();
      const visibleTop=panelRect.top+16;
      const visibleBottom=panelRect.bottom-16;
      const groupTop=Math.min(triggerRect.top,optionsRect.top);
      const groupBottom=Math.max(triggerRect.bottom,optionsRect.bottom);
      const groupHeight=groupBottom-groupTop;
      const visibleHeight=visibleBottom-visibleTop;
      let delta=0;

      if(groupHeight<=visibleHeight){
        delta=(groupTop+groupBottom)/2-(visibleTop+visibleBottom)/2;
      }else if(groupBottom>visibleBottom){
        delta=groupBottom-visibleBottom;
      }else if(groupTop<visibleTop){
        delta=groupTop-visibleTop;
      }

      auth.scrollTo({top:Math.max(0,auth.scrollTop+delta),behavior:'smooth'});
    });
  };
  const keepFormPosition=()=>{
    const position=auth.scrollTop;
    requestAnimationFrame(()=>{auth.scrollTop=position});
  };
  const update=()=>{
    const selected=select.options[select.selectedIndex];
    trigger.innerHTML=`<span>${selected?.textContent||'Select an option'}</span><i>⌄</i>`;
    trigger.classList.toggle('has-value',Boolean(select.value));
    options.querySelectorAll('[role="option"]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.value===select.value)));
  };

  [...select.options].filter(option=>option.value).forEach(option=>{
    const button=document.createElement('button');
    button.type='button';
    button.dataset.value=option.value;
    button.setAttribute('role','option');
    button.textContent=option.textContent;
    button.addEventListener('pointerdown',event=>event.preventDefault());
    button.addEventListener('click',()=>{
      keepFormPosition();
      select.value=option.value;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded','false');
      update();
    });
    options.append(button);
  });

  trigger.addEventListener('click',()=>{
    if(trigger.disabled)return;
    const willOpen=!wrapper.classList.contains('open');
    closeProfileSelects(wrapper);
    wrapper.classList.toggle('open',willOpen);
    trigger.setAttribute('aria-expanded',String(willOpen));
    if(willOpen)scrollOptionsIntoView();
  });
  select.addEventListener('change',update);
  update();
  const control={select,wrapper,trigger};
  profileSelectControls.push(control);
  return control;
}
profileQuestions.forEach(enhanceProfileSelect);document.addEventListener('click',event=>{if(!event.target.closest('.custom-select'))closeProfileSelects()});
function setProfileQuestionState(enabled){profileCreationFields.forEach(input=>{input.disabled=!enabled;input.required=enabled});profileSelectControls.forEach(control=>{control.trigger.disabled=!enabled;control.wrapper.classList.toggle('disabled',!enabled)})}
const phoneProfile=document.createElement('button');phoneProfile.type='button';phoneProfile.className='phone-profile';phoneProfile.setAttribute('aria-label','Open profile menu');phoneProfile.textContent='NM';document.querySelector('.header-actions').append(phoneProfile);
let creating=false;
function toastMessage(title,message){toast.querySelector('strong').textContent=title;toast.querySelector('small').textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2800)}
function closeMenu(){sidebar.classList.remove('open');overlay.classList.remove('show')}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'NM'}
function setUser(name){const clean=name.trim()||'Nutriq Member';document.getElementById('profileName').textContent=clean;document.getElementById('profileAvatar').textContent=initials(clean);phoneProfile.textContent=initials(clean);document.getElementById('greeting').textContent=`Good morning, ${clean}.`}
let dailyGoal=2100;let nutrition={kcal:0,protein:0,carbs:0,fats:0};let detectedMeal=null;
const today=()=>new Date().toLocaleDateString('en-CA');
const profileKey=name=>name.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const dailyKey=name=>`nutriq-day-${profileKey(name)}-${today()}`;
const goalKey=name=>`nutriq-goal-${profileKey(name)}`;
const customMealsKey=name=>`nutriq-meals-${profileKey(name)}-${today()}`;
const savedProfiles=()=>JSON.parse(localStorage.getItem('nutriq-profiles-v1')||'[]');
function saveNutrition(){const user=sessionStorage.getItem('nutriq-user');if(user)localStorage.setItem(dailyKey(user),JSON.stringify(nutrition))}
function loadNutrition(user){dailyGoal=Number(localStorage.getItem(goalKey(user)))||2100;try{nutrition=JSON.parse(localStorage.getItem(dailyKey(user)))||{kcal:0,protein:0,carbs:0,fats:0}}catch{nutrition={kcal:0,protein:0,carbs:0,fats:0}}renderNutrition();loadCustomMeals(user)}
function renderNutrition(){const percent=Math.min(100,Math.round(nutrition.kcal/dailyGoal*100));document.getElementById('kcalValue').textContent=nutrition.kcal.toLocaleString();document.getElementById('goalBadge').textContent=`${percent}% of goal`;document.getElementById('energyProgress').style.width=`${percent}%`;document.getElementById('energyLeft').textContent=`${Math.max(0,dailyGoal-nutrition.kcal).toLocaleString()} kcal left for today`;document.getElementById('proteinValue').textContent=`${nutrition.protein}g`;document.getElementById('carbsValue').textContent=`${nutrition.carbs}g`;document.getElementById('fatsValue').textContent=`${nutrition.fats}g`;document.getElementById('proteinPercent').textContent=`${Math.round(nutrition.protein/130*100)}%`;document.getElementById('carbsPercent').textContent=`${Math.round(nutrition.carbs/250*100)}%`;document.getElementById('fatsPercent').textContent=`${Math.round(nutrition.fats/70*100)}%`;const remainingProtein=Math.max(0,130-nutrition.protein);document.querySelector('.tip-card>p:not(.eyebrow)').textContent=remainingProtein?`You are ${remainingProtein}g away from your goal. Greek yogurt makes an easy win.`:'You reached your protein goal. Great work today.'}
function resetNutrition(){nutrition={kcal:0,protein:0,carbs:0,fats:0};detectedMeal=null;const user=sessionStorage.getItem('nutriq-user');if(user)localStorage.removeItem(customMealsKey(user));document.querySelectorAll('.custom-meal').forEach(card=>card.remove());saveNutrition();renderNutrition()}
function openAuth(mode='signin'){creating=mode==='create';closeProfileSelects();profileSetup.hidden=!creating;setProfileQuestionState(creating);authKicker.textContent=creating?'START YOUR JOURNEY':'WELCOME BACK';authTitle.textContent=creating?'Create your account':'Sign in to Nutriq';authCopy.textContent=creating?'Tell us a little about your routine so Nutriq can be more personal.':'Your food, made simpler.';authSubmit.textContent=creating?'Create account':'Sign in';authSwitch.innerHTML=creating?'Already a member? <b>Sign in</b>':'New here? <b>Create an account</b>';auth.classList.add('open');auth.setAttribute('aria-hidden','false');auth.scrollTop=0;if(window.innerWidth>760)setTimeout(()=>document.getElementById('usernameInput').focus(),80)}
function closeAuth(){if(!sessionStorage.getItem('nutriq-signed-in')){location.href='index.html';return}auth.classList.remove('open');auth.setAttribute('aria-hidden','true')}
document.getElementById('menuBtn').addEventListener('click',()=>{sidebar.classList.add('open');overlay.classList.add('show')});overlay.addEventListener('click',closeMenu);
document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));link.classList.add('active');document.getElementById('pageLabel').textContent=link.dataset.label;showAppView({'#calories':'calories','#planner':'meals','#photoMeal':'photos','#chef':'chef','#recipes':'ideas','#favorites':'saved'}[link.getAttribute('href')]||'calories');closeMenu()}));
document.getElementById('themeBtn').addEventListener('click',()=>applyTheme(!document.body.classList.contains('dark')));
document.getElementById('openAuthBtn').addEventListener('click',()=>openAuth('signin'));document.getElementById('openMenuAuth').addEventListener('click',()=>openAuth('signin'));document.getElementById('loginBtn').addEventListener('click',()=>openAuth('signin'));
document.getElementById('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('nutriq-signed-in');sessionStorage.removeItem('nutriq-user');sidebar.classList.remove('logged-in');closeMenu();openAuth('signin');toastMessage('You are logged out','Sign in again to continue.')});
document.getElementById('closeAuthBtn').addEventListener('click',closeAuth);authSwitch.addEventListener('click',()=>openAuth(creating?'signin':'create'));
form.addEventListener('submit',event=>{event.preventDefault();const user=document.getElementById('usernameInput').value.trim();const profiles=savedProfiles();const exists=profiles.some(profile=>profile.id===profileKey(user));if(!creating&&!exists){toastMessage('Profile not found','Create an account first on this device.');openAuth('create');return}if(creating&&!exists){const calorieGoal=Math.max(800,Math.min(10000,Math.round(Number(calorieGoalInput.value)||2100)));profiles.push({id:profileKey(user),name:user,email:document.getElementById('emailInput').value.trim(),gender:document.getElementById('genderInput').value,gymDays:document.getElementById('gymDaysInput').value,mainGoal:document.getElementById('mainGoalInput').value,diet:document.getElementById('dietInput').value,calorieGoal,createdAt:new Date().toISOString()});localStorage.setItem('nutriq-profiles-v1',JSON.stringify(profiles));localStorage.setItem(goalKey(user),String(calorieGoal))}sessionStorage.setItem('nutriq-signed-in','true');sessionStorage.setItem('nutriq-user',user);setUser(user);loadNutrition(user);sidebar.classList.add('logged-in');auth.classList.remove('open');toastMessage(creating?'Account created!':'Welcome back!',nutrition.kcal?`Today's saved total is ${nutrition.kcal} kcal.`:'Your nutrition day starts at zero.')});
const queryParams=new URLSearchParams(location.search),localPreview=location.protocol==='file:'&&queryParams.get('preview')==='1';
const signed=sessionStorage.getItem('nutriq-signed-in')==='true'||localPreview,mode=queryParams.get('auth');if(signed){const user=localPreview?'Alex Morgan':sessionStorage.getItem('nutriq-user')||'Nutriq Member';sidebar.classList.add('logged-in');setUser(user);loadNutrition(user)}else openAuth(mode==='create'?'create':'signin');
const ingredientInput=document.getElementById('ingredientInput');ingredientInput.addEventListener('keydown',event=>{if(event.key==='Enter'&&ingredientInput.value.trim()){const chip=document.createElement('span');chip.className='chip';chip.innerHTML=`${ingredientInput.value.trim()} <button>×</button>`;ingredientInput.before(chip);ingredientInput.value=''}});document.getElementById('ingredientBox').addEventListener('click',e=>{if(e.target.tagName==='BUTTON')e.target.parentElement.remove()});
const foodPhoto=document.getElementById('foodPhoto'),uploadBtn=document.getElementById('uploadBtn'),photoPreview=document.getElementById('photoPreview'),analysisTitle=document.getElementById('analysisTitle'),analysisText=document.getElementById('analysisText'),addToDayBtn=document.getElementById('addToDayBtn');
const mealEstimates=[{keys:['salmon','fish'],name:'Salmon bowl estimate',kcal:610,protein:42,carbs:54,fats:24},{keys:['chicken','taco'],name:'Chicken meal estimate',kcal:485,protein:38,carbs:44,fats:18},{keys:['pasta','noodle'],name:'Pasta meal estimate',kcal:520,protein:21,carbs:76,fats:16},{keys:['salad','bowl'],name:'Balanced salad estimate',kcal:390,protein:20,carbs:35,fats:19}];
const appModal=document.createElement('section');appModal.className='app-modal';appModal.setAttribute('aria-hidden','true');appModal.innerHTML='<div class="app-modal-card" role="dialog" aria-modal="true" aria-labelledby="appModalTitle"><button class="app-modal-close" type="button" aria-label="Close">×</button><div class="app-modal-content"></div></div>';document.body.append(appModal);
const appModalContent=appModal.querySelector('.app-modal-content');
function closeAppModal(){appModal.classList.remove('open');appModal.setAttribute('aria-hidden','true')}
function openAppModal(content){appModalContent.innerHTML=content;appModal.classList.add('open');appModal.setAttribute('aria-hidden','false');appModal.querySelector('input,button:not(.app-modal-close)')?.focus()}
appModal.querySelector('.app-modal-close').addEventListener('click',closeAppModal);appModal.addEventListener('click',event=>{if(event.target===appModal)closeAppModal()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&appModal.classList.contains('open'))closeAppModal()});
function saveGoal(goal){dailyGoal=Math.max(800,Math.min(10000,Math.round(Number(goal)||2100)));const user=sessionStorage.getItem('nutriq-user');if(user)localStorage.setItem(goalKey(user),String(dailyGoal));renderNutrition();toastMessage('Goal updated',`Your daily goal is now ${dailyGoal.toLocaleString()} kcal.`)}
function openGoalEditor(){openAppModal(`<p class="eyebrow">YOUR DAILY TARGET</p><h2 id="appModalTitle">Set your calorie goal</h2><p>Choose a realistic total for your day. You can change it whenever you need.</p><form id="goalForm" class="action-form"><label>Daily calories<input id="goalInput" type="number" min="800" max="10000" step="50" value="${dailyGoal}" required></label><button type="submit">Save goal</button></form>`);appModal.querySelector('#goalForm').addEventListener('submit',event=>{event.preventDefault();saveGoal(appModal.querySelector('#goalInput').value);closeAppModal()})}
function addMealCard(name,kcal,protein,mealTime='Now',persist=true){const card=document.createElement('article');card.className='meal-card complete custom-meal';card.innerHTML=`<span class="meal-time">${mealTime}</span><span class="meal-art dinner">+</span><div><small>ADDED MEAL</small><h3></h3><p>${kcal} kcal · ${protein}g protein</p></div><button class="meal-check" type="button" aria-label="Mark meal complete">✓</button>`;card.querySelector('h3').textContent=name;document.querySelector('.meals').append(card);card.querySelector('.meal-check').addEventListener('click',()=>{card.classList.toggle('complete');toastMessage(card.classList.contains('complete')?'Meal complete':'Meal reopened',name)});if(persist){const user=sessionStorage.getItem('nutriq-user');if(user){const meals=JSON.parse(localStorage.getItem(customMealsKey(user))||'[]');meals.push({name,kcal,protein,mealTime});localStorage.setItem(customMealsKey(user),JSON.stringify(meals))}}}
function loadCustomMeals(user){document.querySelectorAll('.custom-meal').forEach(card=>card.remove());try{(JSON.parse(localStorage.getItem(customMealsKey(user))||'[]')).forEach(meal=>addMealCard(meal.name,meal.kcal,meal.protein,meal.mealTime,false))}catch{}}
function openMealEditor(defaultName='',defaultKcal='',defaultProtein=''){openAppModal(`<p class="eyebrow">MEAL PLANNER</p><h2 id="appModalTitle">Add a meal</h2><p>Add it to today and Nutriq will update your nutrition totals.</p><form id="mealForm" class="action-form"><label>Meal name<input id="mealNameInput" value="${defaultName}" placeholder="e.g. Greek yogurt bowl" required maxlength="60"></label><div class="form-row"><label>Calories<input id="mealKcalInput" type="number" min="0" max="5000" value="${defaultKcal}" placeholder="420" required></label><label>Protein (g)<input id="mealProteinInput" type="number" min="0" max="500" value="${defaultProtein}" placeholder="24" required></label></div><button type="submit">Add to today</button></form>`);appModal.querySelector('#mealForm').addEventListener('submit',event=>{event.preventDefault();const name=appModal.querySelector('#mealNameInput').value.trim(),kcal=Math.max(0,Math.round(Number(appModal.querySelector('#mealKcalInput').value))),protein=Math.max(0,Math.round(Number(appModal.querySelector('#mealProteinInput').value)));nutrition.kcal+=kcal;nutrition.protein+=protein;saveNutrition();renderNutrition();addMealCard(name,kcal,protein);closeAppModal();toastMessage('Meal added',`${kcal} kcal and ${protein}g protein were added to today.`)})}
function openShoppingList(){const items=['Avocado','Greek yogurt','Baby spinach','Limes'];const key='nutriq-shopping-checks';const checks=JSON.parse(localStorage.getItem(key)||'{}');openAppModal(`<p class="eyebrow">READY TO SHOP</p><h2 id="appModalTitle">Shopping list</h2><p>Check off ingredients as you pick them up.</p><div class="shopping-items">${items.map(item=>`<label><input type="checkbox" data-item="${item}" ${checks[item]?'checked':''}><span>${item}</span></label>`).join('')}</div><button class="modal-secondary" id="clearShopping" type="button">Clear checked items</button>`);appModal.querySelectorAll('.shopping-items input').forEach(input=>input.addEventListener('change',()=>{checks[input.dataset.item]=input.checked;localStorage.setItem(key,JSON.stringify(checks))}));appModal.querySelector('#clearShopping').addEventListener('click',()=>{localStorage.removeItem(key);appModal.querySelectorAll('.shopping-items input').forEach(input=>input.checked=false);toastMessage('List cleared','Your shopping list is ready for the next trip.')})}
function applyTheme(isDark){document.body.classList.toggle('dark',isDark);document.getElementById('themeBtn').textContent=isDark?'☀':'◐';document.getElementById('themeBtn').setAttribute('aria-label',isDark?'Use light theme':'Use dark theme');localStorage.setItem('nutriq-theme',isDark?'dark':'light')}
applyTheme(localStorage.getItem('nutriq-theme')==='dark');
function openSettings(){const isDark=document.body.classList.contains('dark');openAppModal(`<p class="eyebrow">NUTRIQ SETTINGS</p><h2 id="appModalTitle">Make Nutriq yours</h2><p>These settings are saved on this device.</p><div class="setting-options"><label class="setting-option"><span>Dark appearance<small>Use Nutriq with a darker interface.</small></span><input id="themeSetting" type="checkbox" ${isDark?'checked':''}></label><div class="setting-option"><span>Daily calorie goal<small>${dailyGoal.toLocaleString()} kcal per day</small></span><button id="editGoalFromSettings" type="button">Edit</button></div></div><button id="resetToday" class="danger-button" type="button">Reset today’s nutrition</button>`);appModal.querySelector('#themeSetting').addEventListener('change',event=>applyTheme(event.target.checked));appModal.querySelector('#editGoalFromSettings').addEventListener('click',()=>{closeAppModal();openGoalEditor()});appModal.querySelector('#resetToday').addEventListener('click',()=>{if(!confirm('Reset today’s calories and macros?'))return;resetNutrition();closeAppModal();toastMessage('Today was reset','Your nutrition total is back to zero.')})}
document.getElementById('settingsBtn').addEventListener('click',openSettings);
uploadBtn.addEventListener('click',()=>foodPhoto.click());foodPhoto.addEventListener('change',()=>{const file=foodPhoto.files[0];if(!file)return;const filename=file.name.toLowerCase();detectedMeal=mealEstimates.find(meal=>meal.keys.some(key=>filename.includes(key)))||{name:'Balanced meal estimate',kcal:450,protein:25,carbs:48,fats:18};const image=document.createElement('img');image.src=URL.createObjectURL(file);photoPreview.replaceChildren(image);analysisTitle.textContent=detectedMeal.name;analysisText.textContent=`~${detectedMeal.kcal} kcal · ${detectedMeal.protein}g protein · ${detectedMeal.carbs}g carbs`;addToDayBtn.disabled=false;if(window.innerWidth<=760)showPhoneSection('photos');toastMessage('Photo ready','Review the estimate, then add it to today.')});
addToDayBtn.addEventListener('click',()=>{if(!detectedMeal)return;nutrition.kcal+=detectedMeal.kcal;nutrition.protein+=detectedMeal.protein;nutrition.carbs+=detectedMeal.carbs;nutrition.fats+=detectedMeal.fats;saveNutrition();renderNutrition();addToDayBtn.disabled=true;addToDayBtn.textContent='Added';toastMessage('Meal added',`${detectedMeal.kcal} kcal added to today's total.`)});
document.getElementById('adjustGoal').addEventListener('click',openGoalEditor);
document.getElementById('addMeal').addEventListener('click',()=>openMealEditor());
document.querySelector('.meal-card.empty .meal-more').addEventListener('click',()=>openMealEditor('Dinner'));
document.querySelector('.meal-card:not(.empty) .meal-more').addEventListener('click',()=>openMealEditor('Miso salmon power bowl',610,42));
document.querySelectorAll('.meal-check').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.meal-card');card.classList.toggle('complete');toastMessage(card.classList.contains('complete')?'Meal complete':'Meal reopened',card.querySelector('h3').textContent)}));
document.getElementById('generateBtn').addEventListener('click',()=>{const ingredients=[...document.querySelectorAll('.chip')].map(chip=>chip.firstChild.textContent.trim()).filter(Boolean);const recipe=document.createElement('article');recipe.className='recipe';recipe.dataset.tags='high protein quick';recipe.innerHTML='<div class="recipe-cover cover-one"><span>✦</span><button class="heart" type="button">♡</button><small>20 min</small></div><div class="recipe-body"><p class="recipe-type">NUTRIQ CHEF</p><h3></h3><p>A quick idea built from the ingredients in your kitchen.</p><footer><span>520 kcal</span><span>36g protein</span><b>New</b></footer></div>';recipe.querySelector('h3').textContent=`${ingredients.slice(0,2).join(' & ')||'Smart'} bowl`;recipe.querySelector('.heart').addEventListener('click',event=>{event.currentTarget.classList.toggle('active');event.currentTarget.textContent=event.currentTarget.classList.contains('active')?'♥':'♡'});document.querySelector('.recipe-grid').prepend(recipe);if(window.innerWidth<=760)showPhoneSection('ideas');else{showAppView('ideas');document.getElementById('pageLabel').textContent='Fresh ideas'}toastMessage('Recipe created!',`${recipe.querySelector('h3').textContent} is ready to save.`)});
document.getElementById('insightBtn').addEventListener('click',()=>{if(window.innerWidth<=760)showPhoneSection('chef');else{showAppView('chef');document.getElementById('pageLabel').textContent='Nutriq Chef'}});
document.getElementById('shoppingBtn').addEventListener('click',openShoppingList);
document.querySelector('#favorites button').addEventListener('click',()=>{if(window.innerWidth<=760)showPhoneSection('ideas');else{showAppView('ideas');document.getElementById('pageLabel').textContent='Fresh ideas'}toastMessage('Favorites','Tap a heart on any recipe to save it.')});
document.querySelectorAll('.heart').forEach(button=>button.addEventListener('click',()=>{button.classList.toggle('active');button.textContent=button.classList.contains('active')?'♥':'♡'}));document.querySelectorAll('.filter-row button').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter-row button').forEach(x=>x.classList.remove('active'));button.classList.add('active');const filter=button.textContent.toLowerCase();document.querySelectorAll('.recipe').forEach(card=>card.style.display=filter==='all'||card.dataset.tags.includes(filter)?'':'none')}));
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));

const headerLoginButton=document.getElementById('openAuthBtn');
function syncHeaderLogin(){headerLoginButton.hidden=sessionStorage.getItem('nutriq-signed-in')==='true'||localPreview}
syncHeaderLogin();
form.addEventListener('submit',syncHeaderLogin);
document.getElementById('logoutBtn').addEventListener('click',()=>{headerLoginButton.hidden=false});

const menuButton=document.getElementById('menuBtn');
menuButton.addEventListener('click',()=>menuButton.setAttribute('aria-expanded',sidebar.classList.contains('open')?'true':'false'));
overlay.addEventListener('click',()=>menuButton.setAttribute('aria-expanded','false'));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('open')){closeMenu();menuButton.setAttribute('aria-expanded','false');menuButton.focus()}});

const phoneGroups={calories:['.hero','.dashboard-grid','#planner','.meals'],meals:['#planner','.meals'],photos:['#photoMeal'],chef:['#chef'],ideas:['#recipes','.recipe-grid'],saved:['.bottom-panels']};
const appViews={calories:['.hero','.dashboard-grid','#planner','.meals'],meals:['#planner','.meals'],photos:['#photoMeal'],chef:['#chef'],ideas:['#recipes','.recipe-grid'],saved:['.bottom-panels']};
const appViewSelectors=[...new Set(Object.values(appViews).flat())];
function showAppView(name){const active=name in appViews?name:'calories';appViewSelectors.forEach(selector=>document.querySelectorAll(selector).forEach(element=>element.classList.add('app-view-hidden')));appViews[active].forEach(selector=>document.querySelectorAll(selector).forEach(element=>element.classList.remove('app-view-hidden')));document.body.dataset.appView=active}
const mobileCalendarDays=document.getElementById('mobileCalendarDays'),mobileCalendarMonth=document.getElementById('mobileCalendarMonth');
if(mobileCalendarDays&&mobileCalendarMonth){const calendarToday=new Date(),calendarStart=new Date(calendarToday);calendarStart.setDate(calendarToday.getDate()-3);mobileCalendarMonth.textContent=calendarToday.toLocaleDateString(undefined,{month:'long',year:'numeric'});for(let index=0;index<7;index+=1){const calendarDay=new Date(calendarStart);calendarDay.setDate(calendarStart.getDate()+index);const isToday=calendarDay.toDateString()===calendarToday.toDateString();const cell=document.createElement('span');cell.className=isToday?'today':'';cell.innerHTML=`<small>${calendarDay.toLocaleDateString(undefined,{weekday:'narrow'})}</small><b>${calendarDay.getDate()}</b>`;mobileCalendarDays.append(cell)}}
const phoneSwitcher=document.createElement('nav');phoneSwitcher.className='mobile-switcher';phoneSwitcher.setAttribute('aria-label','Phone dashboard sections');
const phoneTabs=[['calories','⌂','Today'],['meals','◷','Meals'],['photos','+','Scan'],['chef','✦','Chef'],['more','•••','More']];
phoneTabs.forEach(([name,icon,label],index)=>{const button=document.createElement('button');button.type='button';button.dataset.phoneTarget=name;button.innerHTML=`<span aria-hidden="true">${icon}</span><small>${label}</small>`;if(index===0)button.classList.add('active');if(name==='photos')button.classList.add('scan-tab');phoneSwitcher.append(button)});
document.body.append(phoneSwitcher);
const phoneMoreMenu=document.createElement('div');phoneMoreMenu.className='phone-more-menu';phoneMoreMenu.innerHTML='<button type="button" data-phone-target="ideas"><span>✧</span>Fresh ideas</button><button type="button" data-phone-target="saved"><span>♡</span>Saved & shopping</button>';document.body.append(phoneMoreMenu);
function showPhoneSection(name){if(window.innerWidth>760)return;showAppView(name);document.body.dataset.phoneView=name;document.body.classList.toggle('phone-meals-view',name==='meals');document.querySelector('.mobile-calendar')?.classList.toggle('hidden',name!=='calories');Object.values(phoneGroups).flat().forEach(selector=>document.querySelectorAll(selector).forEach(element=>{if(!element.closest('.mobile-switcher'))element.classList.add('phone-section-hidden')}));(phoneGroups[name]||phoneGroups.calories).forEach(selector=>document.querySelectorAll(selector).forEach(element=>element.classList.remove('phone-section-hidden')));phoneSwitcher.querySelectorAll('button').forEach(button=>{button.classList.remove('phone-section-hidden');button.classList.toggle('active',button.dataset.phoneTarget===name||(button.dataset.phoneTarget==='more'&&['ideas','saved'].includes(name)))});document.getElementById('pageLabel').textContent={calories:'Today',meals:'Meals',photos:'Scan meal',chef:'Nutriq Chef',ideas:'Fresh ideas',saved:'Saved'}[name]||'Today';phoneMoreMenu.classList.remove('show');window.scrollTo({top:0,behavior:'smooth'})}
phoneSwitcher.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.phoneTarget==='more'){phoneMoreMenu.classList.toggle('show');return}showPhoneSection(button.dataset.phoneTarget)});
phoneMoreMenu.addEventListener('click',event=>{const button=event.target.closest('button');if(button)showPhoneSection(button.dataset.phoneTarget)});
document.addEventListener('click',event=>{if(window.innerWidth>760||!phoneMoreMenu.classList.contains('show'))return;if(event.target.closest('.phone-more-menu')||event.target.closest('[data-phone-target="more"]'))return;phoneMoreMenu.classList.remove('show')});
phoneProfile.addEventListener('click',()=>{if(window.innerWidth>760){sidebar.classList.add('open');overlay.classList.add('show');menuButton.setAttribute('aria-expanded','true');return}if(sessionStorage.getItem('nutriq-signed-in')!=='true'&&!localPreview){openAuth('signin');return}openAppModal('<p class="eyebrow">YOUR ACCOUNT</p><h2 id="appModalTitle">Profile settings</h2><p>Your nutrition, calorie goal and shopping checks are saved on this device.</p><div class="setting-options"><button class="modal-secondary" id="phoneSettings" type="button">Open settings</button><button class="modal-secondary" id="phoneLogout" type="button">Log out</button></div>');appModal.querySelector('#phoneSettings').addEventListener('click',openSettings);appModal.querySelector('#phoneLogout').addEventListener('click',()=>{closeAppModal();document.getElementById('logoutBtn').click()})});
document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',()=>{const map={'#calories':'calories','#planner':'meals','#photoMeal':'photos','#chef':'chef','#recipes':'ideas','#favorites':'saved'};showPhoneSection(map[link.getAttribute('href')])}));
window.addEventListener('resize',()=>{if(window.innerWidth>760){document.querySelectorAll('.phone-section-hidden').forEach(element=>element.classList.remove('phone-section-hidden'));delete document.body.dataset.phoneView;document.body.classList.remove('phone-meals-view')}});
if(window.innerWidth<=760)showPhoneSection(queryParams.get('tab')||location.hash.slice(1)||'calories');else showAppView('calories');

let deferredInstallPrompt;
const installSheet=document.createElement('aside');
installSheet.className='install-sheet';
installSheet.setAttribute('aria-label','Install Nutriq app');
installSheet.innerHTML='<span class="install-icon">N</span><p><b>Install Nutriq</b>Open it like a real app from your home screen.</p><button type="button" class="install-now">Install</button><button type="button" class="dismiss-install" aria-label="Dismiss install prompt">×</button>';
document.body.append(installSheet);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;if(window.innerWidth<=760&&!localStorage.getItem('nutriq-install-dismissed'))installSheet.classList.add('show')});
installSheet.querySelector('.install-now').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installSheet.classList.remove('show')});
installSheet.querySelector('.dismiss-install').addEventListener('click',()=>{localStorage.setItem('nutriq-install-dismissed','true');installSheet.classList.remove('show')});
window.addEventListener('appinstalled',()=>{document.body.classList.add('app-installed');deferredInstallPrompt=null;toastMessage('Nutriq installed','You can now open it from your home screen.')});
phoneSwitcher.addEventListener('click',()=>{if(window.innerWidth<=760&&navigator.vibrate)navigator.vibrate(8)});
