export const APP_VERSION='2.0.0';
export const number=v=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(v);
export const money=v=>`NT$${number(v)}`;
export const percent=v=>`${number(v*100)}%`;
const amount=(id,label,defaultValue,unit='元')=>({id,label,defaultValue,unit});
const rate=(id,label,defaultValue,exclusive=false)=>({...amount(id,label,defaultValue,'%'),rate:true,max:100,exclusive});
const positive=(...ids)=>v=>Object.fromEntries(ids.filter(id=>v[id]<=0).map(id=>[id,'請輸入大於 0 的數值']));
const row=(label,value)=>({label,value});
const costNote='商品毛利尚未扣除平台、金流、運費、包材、廣告及固定費用。';
const variableNote='平台與金流費均以實收商品金額計算；運費為賣家實際負擔。未含固定成本、稅負、退貨及其他未填費用，結果不是淨利。';
const costs=()=>[amount('cost','商品成本',650),rate('platform','平台費率',8),rate('payment','金流費率',2),amount('shipping','賣家負擔運費',60),amount('packaging','包材費',10),amount('ads','每單廣告費',100)];
const expenses=v=>v.cost+v.shipping+v.packaging+v.ads;
const contribution=(v,r)=>r*(1-v.platform-v.payment)-expenses(v);
const costBreakdown=(v,r)=>[row('實收商品金額',money(r)),row('平台費',money(r*v.platform)),row('金流費',money(r*v.payment)),row('商品＋運費＋包材＋廣告',money(expenses(v)))];
const costFormula='平台費＝實收商品金額 × 平台費率；金流費＝實收商品金額 × 金流費率。單筆貢獻利益＝實收商品金額 − 商品成本 − 平台費 − 金流費 − 賣家負擔運費 − 包材費 − 每單廣告費。';
const costSub=(v,r)=>`${number(r)} − ${number(v.cost)} − (${number(r)} × ${percent(v.platform)}) − (${number(r)} × ${percent(v.payment)}) − ${number(v.shipping)} − ${number(v.packaging)} − ${number(v.ads)}`;
const goalFields=()=>[amount('fixedCost','每月固定成本',100000),rate('margin','貢獻毛利率',35,true),amount('orderValue','平均客單價',1000),amount('days','每月營業天數',30,'天')];
const goalDetails=(v,r)=>[row('每月所需訂單',`${number(Math.ceil(r/v.orderValue))} 筆`),row('每日目標訂單',`${number(Math.ceil(Math.ceil(r/v.orderValue)/v.days))} 筆`)];
const goalNote='貢獻毛利率請扣除平台、運費等變動成本。每月訂單＝營業額 ÷ 客單價，向上取整；每日訂單＝每月訂單 ÷ 營業天數，向上取整。各欄位請使用相同期間與成本口徑。';
export const calculators=[
 {id:'gross-margin',group:'商品定價',title:'毛利率',subtitle:'先確認商品本身的獲利空間。',resultLabel:'商品毛利率',formulaText:'（售價 − 商品成本）÷ 售價 × 100%',fields:[amount('price','售價',1000),amount('cost','商品成本',650)],calculate:v=>(v.price-v.cost)/v.price,validate:positive('price'),format:percent,substitute:v=>`(${number(v.price)} − ${number(v.cost)}) ÷ ${number(v.price)} × 100%`,details:v=>[row('每件商品毛利',money(v.price-v.cost))],note:costNote},
 {id:'pricing',group:'商品定價',title:'建議定價',subtitle:'從進價與目標毛利率，找到售價。',resultLabel:'建議售價',formulaText:'進價 ÷（1 − 目標毛利率）',fields:[amount('purchase','進價',650),rate('margin','目標毛利率',35,true)],calculate:v=>v.purchase/(1-v.margin),format:money,substitute:v=>`${number(v.purchase)} ÷ (1 − ${percent(v.margin)})`,note:costNote},
 {id:'cost-backsolve',group:'商品定價',title:'回推成本',subtitle:'售價已決定，算出成本上限。',resultLabel:'可接受商品成本上限',formulaText:'定價 ×（1 − 目標毛利率）',fields:[amount('price','定價',1000),rate('margin','目標毛利率',35,true)],calculate:v=>v.price*(1-v.margin),format:money,substitute:v=>`${number(v.price)} × (1 − ${percent(v.margin)})`,note:costNote},
 {id:'break-even',group:'營運目標',title:'損益兩平',subtitle:'把每月固定支出，換成營業額與訂單目標。',resultLabel:'每月損益兩平營業額',formulaText:'每月固定成本 ÷ 貢獻毛利率',fields:goalFields(),calculate:v=>v.fixedCost/v.margin,validate:positive('margin','orderValue','days'),format:money,substitute:v=>`${number(v.fixedCost)} ÷ ${percent(v.margin)}`,details:goalDetails,note:goalNote},
 {id:'target-revenue',group:'營運目標',title:'目標營業額',subtitle:'從想達成的每月獲利，反推訂單目標。',resultLabel:'每月所需營業額',formulaText:'（每月目標獲利 ＋ 每月固定成本）÷ 貢獻毛利率',fields:[amount('targetProfit','每月目標獲利（稅前）',200000),...goalFields()],calculate:v=>(v.targetProfit+v.fixedCost)/v.margin,validate:positive('margin','orderValue','days'),format:money,substitute:v=>`(${number(v.targetProfit)} ＋ ${number(v.fixedCost)}) ÷ ${percent(v.margin)}`,details:goalDetails,note:goalNote},
 {id:'forecast',group:'流量廣告',title:'業績預估',subtitle:'看懂曝光、點擊到成交的每一步。',resultLabel:'預估營業額',formulaText:'曝光量 × 點擊率 × 轉換率 × 平均客單價',fields:[amount('impressions','曝光量',100000,'次'),rate('clickRate','點擊率',2),rate('conversionRate','轉換率',3),amount('orderValue','平均客單價',1200)],calculate:v=>v.impressions*v.clickRate*v.conversionRate*v.orderValue,format:money,substitute:v=>`${number(v.impressions)} × ${percent(v.clickRate)} × ${percent(v.conversionRate)} × ${number(v.orderValue)}`,details:v=>[row('預估點擊＝曝光 × 點擊率',`${number(v.impressions*v.clickRate)} 次`),row('預估訂單＝點擊 × 轉換率',`${number(v.impressions*v.clickRate*v.conversionRate)} 筆`)],scenarios:v=>[.8,1,1.2].map((f,i)=>({label:['保守','目前','樂觀'][i],rate:percent(Math.min(1,v.conversionRate*f)),value:money(v.impressions*v.clickRate*Math.min(1,v.conversionRate*f)*v.orderValue)})),note:'情境比較僅將轉換率乘以 0.8／1／1.2（最高 100%），其他條件不變；屬於假設試算，不代表保證業績。預估訂單可為小數。'},
 {id:'contribution',group:'獲利促銷',title:'單筆實際獲利',subtitle:'把每單費用算進來，看還剩多少。',isNew:true,resultLabel:'單筆貢獻利益（非淨利）',formulaText:costFormula,fields:[amount('price','實收商品金額',1000),...costs()],calculate:v=>contribution(v,v.price),validate:positive('price'),format:money,substitute:v=>costSub(v,v.price),details:(v,r)=>[row('貢獻利益率＝利益 ÷ 實收',percent(r/v.price)),...costBreakdown(v,v.price)],note:variableNote},
 {id:'discount',group:'獲利促銷',title:'折扣與促銷',subtitle:'確認折扣後獲利，守住促銷底線。',isNew:true,resultLabel:'促銷後單筆貢獻利益',formulaText:'實收商品金額＝原價 × 售價比例 − 賣家折價券。'+costFormula+' 損益兩平實收價＝（商品成本＋運費＋包材＋廣告）÷（1−平台費率−金流費率）。',fields:[amount('price','原價',1000),{...rate('saleRate','售價比例',90),hint:'90 代表九折；100 為原價'},amount('coupon','賣家負擔折價券',0),...costs()],validate:v=>({...((v.platform+v.payment>=1)?{platform:'平台與金流費率合計須小於 100%'}:{}),...((v.price*v.saleRate-v.coupon<0)?{coupon:'折價券不可超過折後商品金額'}:{})}),calculate:v=>contribution(v,v.price*v.saleRate-v.coupon),format:money,substitute:v=>`實收＝${number(v.price)} × ${percent(v.saleRate)} − ${number(v.coupon)}＝${number(v.price*v.saleRate-v.coupon)}；利益＝${costSub(v,v.price*v.saleRate-v.coupon)}`,details:v=>[...costBreakdown(v,v.price*v.saleRate-v.coupon),row('不虧損實收價（未含固定費用）',money(expenses(v)/(1-v.platform-v.payment))),row('底價代入',`${number(expenses(v))} ÷ (1 − ${percent(v.platform)} − ${percent(v.payment)})`)],note:variableNote},
 {id:'roas',group:'流量廣告',title:'廣告效益',subtitle:'不只看營業額，也看廣告後的利益。',isNew:true,resultLabel:'廣告投資報酬倍數 ROAS',formulaText:'ROAS＝廣告歸因營業額 ÷ 廣告支出。廣告後貢獻利益＝廣告歸因營業額 × 廣告前貢獻毛利率 − 廣告支出。損益兩平 ROAS＝1 ÷ 廣告前貢獻毛利率。',fields:[amount('revenue','廣告歸因營業額',72000),amount('spend','廣告支出',15000),rate('margin','廣告前貢獻毛利率',35)],validate:positive('spend','margin'),calculate:v=>v.revenue/v.spend,format:v=>`${number(v)} 倍`,substitute:v=>`${number(v.revenue)} ÷ ${number(v.spend)}`,details:v=>[row('廣告後貢獻利益',money(v.revenue*v.margin-v.spend)),row('利益代入',`${number(v.revenue)} × ${percent(v.margin)} − ${number(v.spend)}`),row('損益兩平 ROAS',`${number(1/v.margin)} 倍`),row('兩平代入',`1 ÷ ${percent(v.margin)}`)],note:'廣告前貢獻毛利率須已扣除商品、平台、金流、運費等變動成本，但不含本次廣告費。期間與歸因口徑須一致；利益未扣固定費用與稅負。'}
];
export function evaluate(c,raw){
 const errors={},values={};
 for(const f of c.fields){const input=raw?.[f.id],v=Number(input);if(input==null||String(input).trim()===''||!Number.isFinite(v))errors[f.id]='請輸入有效數字';else if(v<0)errors[f.id]='請輸入 0 或以上的數值';else if(v>1e12)errors[f.id]='數值上限為 1 兆，請調整計算單位';else if(f.max!==undefined&&(f.exclusive?v>=f.max:v>f.max))errors[f.id]=f.exclusive?'比例須小於 100%':'比例須介於 0% 至 100%';values[f.id]=f.rate?v/100:v;}
 if(!Object.keys(errors).length)Object.assign(errors,c.validate?.(values)||{});
 if(Object.keys(errors).length)return {errors,result:null,values};
 const result=c.calculate(values);
 if(!Number.isFinite(result)||Math.abs(result)>Number.MAX_SAFE_INTEGER)return {errors:{_form:'結果超出安全計算範圍，請調整數值。'},result:null,values};
 return {errors,result,values};
}
