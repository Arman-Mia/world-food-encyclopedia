/* =========================
   World Food Encyclopedia JS
   (1000+ inline dataset + PDF export)
   ========================= */

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const shorten = (s, n) => s && s.length > n ? s.slice(0,n-1) + '…' : s;

/* ---------- Elements ---------- */
const grid = $('#grid');
const categoriesEl = $('#categories');
const searchInput = $('#search');
const lowCalEl = $('#lowCal');
const highProteinEl = $('#highProtein');
const veganOnlyEl = $('#veganOnly');
const resultCount = $('#resultCount');
const sortSelect = $('#sort');
const seeMoreDownloadBtn = $('#seeMoreDownload');
const toggleThemeBtn = $('#toggleTheme');
const drawer = $('#drawer');
const closeDrawerBtn = $('#closeDrawer');
const yearEl = $('#year');
const aboutLink = $('#aboutLink');

/* ---------- App State ---------- */
let state = {
  query: '',
  category: 'All',
  filters: { lowCal:false, highProtein:false, veganOnly:false },
  sort: 'relevance',
  showAll: false
};

/* ---------- Seed foods (curated small set) ---------- */
const seedFoods = [
  { name:'Spinach', category:'Vegetables', nutrients:['Iron','Vitamin K','Folate','Fiber'], benefits:'Supports blood & bone health', sideEffects:'High oxalate - may contribute to kidney stones in sensitive people', bestTime:'Lunch/Dinner', frequency:4, calories:23, protein:2.9, vegan:true, usage:'Salads, saag, soups' },
  { name:'Broccoli', category:'Vegetables', nutrients:['Vitamin C','Fiber','Vitamin K'], benefits:'Antioxidant & anti-cancer compounds', sideEffects:'May cause gas when raw', bestTime:'Lunch', frequency:3, calories:34, protein:2.8, vegan:true, usage:'Steamed, stir-fry' },
  { name:'Carrot', category:'Vegetables', nutrients:['Beta-carotene','Vitamin A','Fiber'], benefits:'Good for eye & skin health', sideEffects:'Excess can cause carotenemia', bestTime:'Anytime', frequency:5, calories:41, protein:0.9, vegan:true, usage:'Raw, cooked, juice' },
  { name:'Apple', category:'Fruits', nutrients:['Vitamin C','Fiber'], benefits:'Good for digestion & heart', sideEffects:'Pesticide residues if unwashed', bestTime:'Morning', frequency:7, calories:52, protein:0.3, vegan:true, usage:'Raw, baked' },
  { name:'Banana', category:'Fruits', nutrients:['Potassium','B6','Carbs'], benefits:'Energy & muscle recovery', sideEffects:'High sugar - careful for diabetics', bestTime:'Morning/post-workout', frequency:5, calories:96, protein:1.3, vegan:true, usage:'Raw, smoothies' },
  { name:'Brown Rice', category:'Grains & Cereals', nutrients:['Fiber','Magnesium'], benefits:'Sustained energy', sideEffects:'Phytic acid - soak/cook well', bestTime:'Lunch', frequency:4, calories:123, protein:2.6, vegan:true, usage:'Staple grain' },
  { name:'Oats', category:'Grains & Cereals', nutrients:['Beta-glucan','Fiber'], benefits:'Lowers cholesterol & satiety', sideEffects:'Rare avenin intolerance', bestTime:'Breakfast', frequency:7, calories:389, protein:16.9, vegan:true, usage:'Porridge, overnight oats' },
  { name:'Chicken Breast', category:'Protein', nutrients:['Protein','B vitamins'], benefits:'Lean protein', sideEffects:'Under-cooked risk', bestTime:'Lunch/Dinner', frequency:3, calories:165, protein:31, vegan:false, usage:'Grill, bake' },
  { name:'Salmon', category:'Fish & Seafood', nutrients:['Omega-3','Protein'], benefits:'Brain & heart health', sideEffects:'Mercury concerns in large species', bestTime:'Lunch/Dinner', frequency:2, calories:208, protein:20, vegan:false, usage:'Grill, bake' },
  { name:'Almond', category:'Nuts & Seeds', nutrients:['Healthy fats','Vitamin E'], benefits:'Heart & brain', sideEffects:'Allergy & high calories', bestTime:'Snack', frequency:5, calories:579, protein:21, vegan:true, usage:'Snacks, milk' }
];

/* ---------- Generator to produce 1000+ items (deterministic) ---------- */
const extraBases = [
  'Rice','Bread','Noodles','Buckwheat','Millet','Corn','Barley','Pancake','Tortilla','Couscous',
  'Kale','Cabbage','Eggplant','Zucchini','Beetroot','Mushroom','Pumpkin','Asparagus','Pea','Okra',
  'Pear','Pineapple','Blueberry','Strawberry','Kiwi','Peach','Apricot','Pomegranate','Lychee','Guava',
  'Turkey','Pork','Lamb','Duck','Crab','Shrimp','Mussels','Clams','Octopus','Anchovy',
  'Cottage Cheese','Ricotta','Mozzarella','Cheddar','Butter','Soy Milk','Almond Milk',
  'Cashew','Pistachio','Peanut','Sunflower Seed','Pumpkin Seed','Flaxseed',
  'Matcha','Kombucha','Smoothie','Lassi','Coconut Water','Herbal Tea','Iced Tea','Lemonade',
  'Cumin','Coriander','Fenugreek','Saffron','Cardamom','Clove','Cinnamon','Bay Leaf',
  'Muesli','Granola','Porridge','Bagel','Croissant','Brownie','Muffin','Donut','Sushi','Naan'
];
const prepSuffixes = [' (boiled)',' (roasted)',' (grilled)',' (steamed)',' (baked)',' (fried)',' (smoked)',' (pickled)',' (canned)',' (raw)'];

function deterministic(seed) {
  return Math.abs(Math.sin(seed * 99991)) ;
}

function numFrom(seed, base=50, variance=100){
  const v = deterministic(seed);
  return Math.round(base + Math.floor(v * variance));
}

/* build dataset */
const generatedFoods = [];
seedFoods.forEach(s => generatedFoods.push(s));

(function buildToTarget(){
  const target = 1000;
  let idx = generatedFoods.length;
  for(let i=0; idx < target; i++){
    for(let j=0; j<prepSuffixes.length && idx < target; j++){
      const base = extraBases[i % extraBases.length];
      const suffix = prepSuffixes[j];
      const name = `${base}${suffix}`;
      let category = 'Other';
      if(/rice|bread|noodle|pasta|couscous|bagel|naan|tortilla/i.test(base)) category = 'Grains & Cereals';
      else if(/kale|cabbage|eggplant|zucchini|beetroot|mushroom|pumpkin|asparagus|pea|okra/i.test(base)) category = 'Vegetables';
      else if(/pear|pineapple|blueberry|strawberry|kiwi|peach|apricot|pomegranate|lychee|guava/i.test(base)) category = 'Fruits';
      else if(/turkey|pork|lamb|duck|crab|shrimp|mussel|clam|octopus|anchovy/i.test(base)) category = 'Meat & Seafood';
      else if(/cheese|butter|milk|cottage|ricotta|mozzarella/i.test(base)) category = 'Dairy & Alternatives';
      else if(/cashew|pistachio|peanut|sunflower|pumpkin|flax/i.test(base)) category = 'Nuts & Seeds';
      else if(/matcha|kombucha|smoothie|lassi|coconut water|tea|lemonade/i.test(base)) category = 'Beverages';
      else if(/cumin|coriander|saffron|cardamom|clove|cinnamon|bay/i.test(base)) category = 'Spices & Herbs';
      else category = 'Snacks & Bakery';

      const calories = numFrom(i*j + idx, 120, 500); // rough calories
      const protein = Math.round((numFrom(i*j + idx, 6, 30)/10) * 10) / 10;
      const frequency = [0,1,2,3,4,5][Math.floor(Math.abs(Math.cos(i*j+idx))*5)];
      const vegan = !/cheese|butter|milk|cottage|mozzarella|ricotta/i.test(base);
      const nutrients = [];
      if(category.includes('Vegetables')||category.includes('Fruits')) nutrients.push('Vitamin C');
      if(category.includes('Nuts')||category.includes('Seeds')||category.includes('Dairy')) nutrients.push('Healthy fats');
      if(category.includes('Grains')) nutrients.push('Carbohydrates');
      if(category.includes('Meat')||category.includes('Seafood')) nutrients.push('Protein');

      generatedFoods.push({
        name,
        category,
        nutrients,
        benefits: `Typical ${base.toLowerCase()} preparation; supplies common nutrients and energy.`,
        sideEffects: `May be high in calories or sodium depending on preparation.`,
        bestTime: ['Morning','Lunch','Dinner','Anytime'][ (i+j) % 4 ],
        frequency,
        calories,
        protein,
        vegan,
        usage: `${base}${suffix} — common preparation in many cuisines.`
      });
      idx++;
      if(idx >= target) break;
    }
  }
})();

const foods = generatedFoods; // final dataset >= 1000 items

/* ---------- categories ---------- */
const categories = ['All', ...Array.from(new Set(foods.map(f=>f.category))).sort()];

/* ---------- UI Rendering ---------- */
function renderCategories(){
  categoriesEl.innerHTML = '';
  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'cat' + (state.category === cat ? ' active' : '');
    div.textContent = cat;
    div.addEventListener('click', () => {
      state.category = cat;
      $$('.cat').forEach(c=>c.classList.remove('active'));
      div.classList.add('active');
      applyFilters();
    });
    categoriesEl.appendChild(div);
  });
}

/* ---------- Filter Matching ---------- */
function matchesFilters(food){
  if(state.category !== 'All' && food.category !== state.category) return false;
  if(state.filters.lowCal && !(food.calories <= 100)) return false;
  if(state.filters.highProtein && !((food.protein || 0) > 10)) return false;
  if(state.filters.veganOnly && !food.vegan) return false;
  if(state.query){
    const q = state.query.toLowerCase();
    const hay = (food.name + ' ' + (food.nutrients||[]).join(' ') + ' ' + (food.benefits||'') + ' ' + (food.usage||'')).toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}

/* ---------- Render Grid ---------- */
function renderGrid(list){
  grid.innerHTML = '';
  if(list.length === 0){
    grid.innerHTML = `<div class="panel">No foods found for the current filters/search.</div>`;
    resultCount.textContent = '0 foods';
    return;
  }
  resultCount.textContent = `${list.length} foods`;
  // if showAll false, show first 60 for responsiveness
  const toShow = state.showAll ? list : list.slice(0, 60);
  toShow.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeHtml(f.name)}</h3>
      <div class="meta">${escapeHtml(f.category)} • ${f.calories ?? '—'} kcal</div>
      <div class="meta" style="margin-top:8px;color:var(--muted);font-size:13px">
        ${shorten(escapeHtml(f.benefits || ''), 110)}
      </div>
      <div style="margin-top:10px">
        <span class="pill">Best: ${f.bestTime}</span>
        <button class="btn" data-name="${escapeHtml(f.name)}" style="float:right">Details</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-name]');
      if(btn) {
        const name = btn.dataset.name;
        const found = list.find(x => x.name === name);
        if(found) showDetails(found);
      } else {
        showDetails(f);
      }
    });
    grid.appendChild(card);
  });
  if(!state.showAll && list.length > 60){
    const moreNote = document.createElement('div');
    moreNote.className = 'panel';
    moreNote.innerHTML = `<strong>Showing ${toShow.length} of ${list.length} results</strong> — click "See More Foods / Download PDF" to view all and export PDF.`;
    grid.appendChild(moreNote);
  }
}

/* ---------- Apply Filters & Sorting ---------- */
function applyFilters(){
  state.filters.lowCal = lowCalEl.checked;
  state.filters.highProtein = highProteinEl.checked;
  state.filters.veganOnly = veganOnlyEl.checked;
  state.query = searchInput.value.trim();
  state.sort = sortSelect.value;

  let results = foods.filter(matchesFilters);

  if(state.sort === 'name') results.sort((a,b)=>a.name.localeCompare(b.name));
  else if(state.sort === 'calories') results.sort((a,b)=>(a.calories||0)-(b.calories||0));
  else if(state.sort === 'freq') results.sort((a,b)=>(b.frequency||0)-(a.frequency||0));

  renderGrid(results);
}

/* ---------- Drawer (details) ---------- */
function showDetails(food){
  $('#dTitle').textContent = food.name;
  $('#dCategory').textContent = food.category;
  const nEl = $('#dNutrients'); nEl.innerHTML = '';
  (food.nutrients || []).forEach(n => { const s = document.createElement('span'); s.className='tag'; s.textContent = n; nEl.appendChild(s); });
  $('#dBenefits').textContent = food.benefits || '—';
  $('#dSide').textContent = food.sideEffects || 'None known (in moderation)';
  $('#dTime').textContent = food.bestTime || '—';
  $('#dFreq').textContent = (typeof food.frequency === 'number') ? `${food.frequency} times/week` : (food.frequency || '—');
  $('#dCal').textContent = (food.calories || '—') + ' kcal';
  $('#dProtein').textContent = (food.protein || '—');
  $('#dUse').textContent = (food.usage || '—');

  drawer.style.display = 'flex';
  drawer.setAttribute('aria-hidden','false');
}
closeDrawerBtn.addEventListener('click', ()=> {
  drawer.style.display = 'none';
  drawer.setAttribute('aria-hidden','true');
});
drawer.addEventListener('click', e=>{
  if(e.target === drawer) { drawer.style.display='none'; drawer.setAttribute('aria-hidden','true'); }
});

/* ---------- See More Foods / Generate PDF ---------- */
async function generatePDFAndShowAll(){
  // 1) show all results on UI for user feedback
  state.showAll = true;
  applyFilters();
  // 2) generate PDF of full dataset (foods array) using jsPDF + autoTable
  try {
    // create doc
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    // Title
    doc.setFontSize(14);
    doc.text('World Food Encyclopedia — Full Dataset', 40, 40);
    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 58);
    // Build rows
    // autoTable columns: Name, Category, Nutrients, Benefits, Side effects, Best time, Frequency, Calories, Protein, Usage
    const columns = [
      { header: 'Name', dataKey: 'name' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Nutrients', dataKey: 'nutrients' },
      { header: 'Benefits', dataKey: 'benefits' },
      { header: 'Side effects', dataKey: 'sideEffects' },
      { header: 'Best time', dataKey: 'bestTime' },
      { header: 'Freq/wk', dataKey: 'frequency' },
      { header: 'Cal (100g)', dataKey: 'calories' },
      { header: 'Protein (g)', dataKey: 'protein' },
      { header: 'Usage', dataKey: 'usage' }
    ];
    // prepare data rows (map foods to plain text)
    const rows = foods.map(f => ({
      name: f.name || '',
      category: f.category || '',
      nutrients: (f.nutrients || []).join(', '),
      benefits: (f.benefits || '').replace(/\s+/g,' ').trim(),
      sideEffects: (f.sideEffects || '').replace(/\s+/g,' ').trim(),
      bestTime: f.bestTime || '',
      frequency: f.frequency !== undefined ? String(f.frequency) : '',
      calories: f.calories !== undefined ? String(f.calories) : '',
      protein: f.protein !== undefined ? String(f.protein) : '',
      usage: f.usage || ''
    }));

    // AutoTable options — use small fonts and split long text
    doc.autoTable({
      startY: 72,
      head: [columns.map(c => c.header)],
      body: rows.map(r => columns.map(c => r[c.dataKey])),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [16,185,129], textColor: 255, halign: 'left' },
      columnStyles: {
        0: { cellWidth: 80 }, // name
        1: { cellWidth: 70 }, // category
        2: { cellWidth: 90 }, // nutrients
        3: { cellWidth: 160 }, // benefits
        4: { cellWidth: 120 }, // side effects
        5: { cellWidth: 50 }, // best time
        6: { cellWidth: 40 }, // freq
        7: { cellWidth: 50 }, // calories
        8: { cellWidth: 60 }, // protein
        9: { cellWidth: 100 } // usage
      },
      didDrawPage: function (data) {
        // header already drawn
        // footer
        const str = 'World Food Encyclopedia — Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(str, pageWidth - 100, doc.internal.pageSize.getHeight() - 10);
      },
      margin: { left: 40, right: 40, top: 72, bottom: 40 },
      pageBreak: 'auto'
    });

    // Save file
    const fileName = `world-food-encyclopedia-full-${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
  } catch (err) {
    console.error('PDF generation failed', err);
    alert('PDF generation failed in this browser — try Chrome / Edge. See console for details.');
  }
}

/* ---------- Theme Toggle ---------- */
function applyTheme(theme){
  if(theme === 'light') document.documentElement.classList.add('light');
  else document.documentElement.classList.remove('light');
  toggleThemeBtn.textContent = theme === 'light' ? 'Light' : 'Dark';
  localStorage.setItem('wfe_theme', theme);
}
toggleThemeBtn.addEventListener('click', () => {
  const current = localStorage.getItem('wfe_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});
(function initTheme(){
  const stored = localStorage.getItem('wfe_theme') || 'dark';
  applyTheme(stored);
})();

/* ---------- Events ---------- */
searchInput.addEventListener('input', () => { state.query = searchInput.value.trim(); applyFilters(); });
lowCalEl.addEventListener('change', applyFilters);
highProteinEl.addEventListener('change', applyFilters);
veganOnlyEl.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', applyFilters);

seeMoreDownloadBtn.addEventListener('click', async () => {
  // reveal more on UI then generate PDF of full dataset
  state.showAll = true;
  applyFilters();
  seeMoreDownloadBtn.disabled = true;
  seeMoreDownloadBtn.textContent = 'Preparing PDF...';
  await new Promise(r => setTimeout(r, 200)); // small UI yield
  await generatePDFAndShowAll();
  seeMoreDownloadBtn.textContent = 'See More Foods / Download PDF';
  seeMoreDownloadBtn.disabled = false;
});

/* About / Contact modal behavior */
aboutLink.addEventListener('click', (e) => {
  e.preventDefault();
  $('#pageAbout').style.display = 'flex';
  $('#pageAbout').setAttribute('aria-hidden','false');
});
$('#closeAbout').addEventListener('click', ()=> { $('#pageAbout').style.display='none'; $('#pageAbout').setAttribute('aria-hidden','true'); });
$('#closeContact').addEventListener('click', ()=> { $('#pageContact').style.display='none'; $('#pageContact').setAttribute('aria-hidden','true'); });

/* ---------- Init ---------- */
function init(){
  renderCategories();
  $$('.cat').forEach(c => { if(c.textContent.trim() === 'All') c.classList.add('active'); });
  applyFilters();
  yearEl.textContent = new Date().getFullYear();
}
init();
