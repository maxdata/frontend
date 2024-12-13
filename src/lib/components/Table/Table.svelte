<script lang="ts">
  import { screenWidth } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import { onMount } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { page } from "$app/stores";

  export let data;
  export let rawData;
  export let excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "marketCap",
  ]);

  export let defaultList = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Revenue", rule: "revenue" },
  ];

  export let hideLastRow = false;

  let ruleOfList = defaultList;
  const defaultRules = defaultList?.map((item) => item?.rule);

  let pagePathName = $page?.url?.pathname;
  let testList = [];
  let searchQuery = "";

  let downloadWorker: Worker | undefined;
  let checkedItems;

  let stockList = rawData?.slice(0, 50);
  let allRows = [
    { name: "Volume", rule: "volume", type: "int" },
    { name: "Avg. Volume", rule: "avgVolume", type: "int" },
    { name: "Market Cap", rule: "marketCap", type: "int" },
    { name: "Price", rule: "price", type: "float" },
    { name: "% Change", rule: "changesPercentage", type: "percentSign" },
    { name: "EPS", rule: "eps", type: "float" },
    { name: "PE", rule: "pe", type: "float" },
    { name: "PB Ratio", rule: "priceToBookRatio", type: "float" },
    { name: "PS Ratio", rule: "priceToSalesRatio", type: "float" },
    { name: "AI Score", rule: "score", type: "rating" },
    { name: "Revenue", rule: "revenue", type: "int" },
    { name: "EBITDA", rule: "ebitda", type: "int" },
    { name: "Net Income", rule: "netIncome", type: "int" },
    { name: "FCF", rule: "freeCashFlow", type: "int" },
    { name: "Industry", rule: "industry", type: "str" },
    { name: "Sector", rule: "sector", type: "str" },
    { name: "Price Change 1W", rule: "change1W", type: "percentSign" },
    { name: "Price Change 1M", rule: "change1M", type: "percentSign" },
    { name: "Price Change 3M", rule: "change3M", type: "percentSign" },
    { name: "Price Change 6M", rule: "change6M", type: "percentSign" },
    { name: "Price Change 1Y", rule: "change1Y", type: "percentSign" },
    { name: "Enterprise Value", rule: "enterpriseValue", type: "int" },
    { name: "Forward PE", rule: "forwardPE", type: "float" },
    { name: "Forward PS", rule: "forwardPS", type: "float" },
    { name: "Dividend Yield", rule: "dividendYield", type: "percent" },
    { name: "Current Ratio", rule: "currentRatio", type: "float" },
    { name: "Quick Ratio", rule: "quickRatio", type: "float" },
    { name: "Analyst Rating", rule: "analystRating", type: "rating" },
    { name: "Analyst Count", rule: "analystCounter", type: "int" },
    { name: "Price Target", rule: "priceTarget", type: "float" },
    { name: "Upside", rule: "upside", type: "percentSign" },
    { name: "Country", rule: "country", type: "str" },
    { name: "Gross Profit", rule: "grossProfit", type: "int" },
    { name: "Revenue Growth", rule: "growthRevenue", type: "percentSign" },
    {
      name: "Gross Profit Growth",
      rule: "growthGrossProfit",
      type: "percentSign",
    },
    { name: "Net Income Growth", rule: "growthNetIncome", type: "percentSign" },
    { name: "EBITDA Growth", rule: "growthEBITDA", type: "percentSign" },
    { name: "EPS Growth", rule: "growthEPS", type: "percentSign" },
    { name: "Total Debt", rule: "totalDebt", type: "int" },
    { name: "Return on Assets", rule: "returnOnAssets", type: "int" },
    { name: "Return on Equity", rule: "returnOnEquity", type: "int" },
    { name: "Value-at-Risk", rule: "var", type: "percentSign" },
    { name: "Asset Turnover", rule: "assetTurnover", type: "int" },
    { name: "Earnings Yield", rule: "earningsYield", type: "percent" },
    { name: "Altman-Z-Score", rule: "altmanZScore", type: "float" },
    { name: "Piotroski F-Score", rule: "piotroskiScore", type: "float" },
    { name: "Total Liabilities", rule: "totalLiabilities", type: "int" },
    { name: "Short Ratio", rule: "shortRatio", type: "int" },
    { name: "Short Interest", rule: "sharesShort", type: "int" },
    { name: "Short % Float", rule: "shortFloatPercent", type: "percent" },
    {
      name: "Short % Shares",
      rule: "shortOutStandingPercent",
      type: "percent",
    },
    { name: "FCF Yield", rule: "freeCashFlowYield", type: "percent" },
    { name: "Employees", rule: "employees", type: "int" },
    { name: "Debt Ratio", rule: "debtRatio", type: "float" },
    { name: "Debt / Equity", rule: "debtEquityRatio", type: "int" },
    { name: "Profit Margin", rule: "netProfitMargin", type: "percent" },
    { name: "FTD Shares", rule: "failToDeliver", type: "int" },
    { name: "Interest Income", rule: "interestIncome", type: "int" },
    { name: "Operating Income", rule: "operatingIncome", type: "int" },
    {
      name: "Operating Income Growth",
      rule: "growthOperatingIncome",
      type: "percentSign",
    },
    {
      name: "Research & Development",
      rule: "researchAndDevelopmentExpenses",
      type: "int",
    },
    { name: "Shares Outstanding", rule: "sharesOutStanding", type: "int" },
    { name: "Profit Per Employee", rule: "profitPerEmployee", type: "int" },
    { name: "Revenue Per Employee", rule: "revenuePerEmployee", type: "int" },
    {
      name: "Institutional Ownership",
      rule: "institutionalOwnership",
      type: "percent",
    },
  ];

  const proOnlyItems = new Set(
    allRows
      ?.filter((item) => !excludedRules?.has(item?.rule)) // Exclude the items based on the rule
      ?.map((item) => item?.name), // Map the remaining items to their names
  );

  checkedItems = new Set(ruleOfList.map((item) => item.name));
  allRows = sortIndicatorCheckMarks(allRows);
  const handleDownloadMessage = (event) => {
    let updateData = event?.data?.rawData ?? []; // Use a new variable for updated data
    // Check if both arrays exist and have data
    if (!updateData?.length || !rawData?.length) {
      return;
    }

    for (let i = 0; i < updateData.length; i++) {
      if (rawData[i]) {
        // Create a new object to merge the data
        let newData = {};

        // Merge fields from updateData
        Object.assign(newData, updateData[i]);

        // Merge fields from defaultRules that are missing in updateData
        defaultRules.forEach((rule) => {
          if (!(rule in updateData[i]) && rule in rawData[i]) {
            newData[rule] = rawData[i][rule];
          }
        });

        // Preserve the original 'priceTarget' value from rawData
        for (let rule of defaultRules) {
          if (rule in rawData[i]) {
            newData[rule] = rawData[i][rule];
          }
        }

        // Ensure 'rank' and 'years' are added if they are missing in updateData
        if (!("rank" in updateData[i]) && "rank" in rawData[i]) {
          newData.rank = rawData[i]["rank"];
        }
        if (!("years" in updateData[i]) && "years" in rawData[i]) {
          newData.years = rawData[i]["years"];
        }

        updateData[i] = newData;
      }
    }

    rawData = updateData;
    stockList = rawData?.slice(0, 50); // Assign to stockList instead of rawData directly
    columns = generateColumns(rawData);
    sortOrders = generateSortOrders(rawData);
  };

  const updateStockScreenerData = async () => {
    downloadWorker.postMessage({
      ruleOfList: ruleOfList,
      tickerList: rawData?.map((item) => item?.symbol),
    });
  };

  function saveRules() {
    try {
      // Save the version along with the rules
      localStorage?.setItem(pagePathName, JSON?.stringify(ruleOfList));
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  async function handleResetAll() {
    searchQuery = "";
    ruleOfList = defaultList;
    ruleOfList = [...ruleOfList];
    checkedItems = new Set(ruleOfList.map((item) => item.name));
    allRows = sortIndicatorCheckMarks(allRows);
    await updateStockScreenerData();

    saveRules();
  }

  function handleInput(event) {
    searchQuery = event.target.value?.toLowerCase() || "";

    setTimeout(() => {
      testList = [];

      if (searchQuery.length > 0) {
        const rawList = allRows;
        testList =
          rawList?.filter((item) => {
            const index = item?.name?.toLowerCase();
            // Check if country starts with searchQuery
            return index?.startsWith(searchQuery);
          }) || [];
      }
    }, 50);
  }

  function isChecked(item) {
    return checkedItems?.has(item);
  }

  function sortIndicatorCheckMarks(allRows) {
    return allRows.sort((a, b) => {
      const isAChecked = checkedItems.has(a?.name);
      const isBChecked = checkedItems.has(b?.name);

      // Sort checked items first
      if (isAChecked !== isBChecked) return isAChecked ? -1 : 1;

      // Prioritize items based on default rules
      const isADefaultRule = defaultRules?.includes(a?.rule);
      const isBDefaultRule = defaultRules?.includes(b?.rule);
      if (isADefaultRule !== isBDefaultRule) {
        return isADefaultRule ? -1 : 1;
      }

      // Check if the user is not Pro
      if (data?.user?.tier !== "Pro") {
        const isAPriority = proOnlyItems.has(a?.name);
        const isBPriority = proOnlyItems.has(b?.name);

        // If both are priority items or both are not, sort alphabetically
        if (isAPriority === isBPriority) return a.name.localeCompare(b.name);

        // Move priority items to the bottom for non-Pro users
        return isAPriority ? 1 : -1;
      }

      // If the user is Pro, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  async function handleChangeValue(value) {
    if (checkedItems.has(value)) {
      checkedItems.delete(value); // Remove the value if it's already in the Set
    } else {
      checkedItems.add(value); // Add the value if it's not in the Set
      // Update ruleOfList based on checked items from indicatorList
    }
    ruleOfList = allRows.filter((item) => checkedItems.has(item.name)); // Assuming each item has a `value` property
    allRows = [...allRows];
    ruleOfList = [...ruleOfList];

    await updateStockScreenerData();
    allRows = sortIndicatorCheckMarks(allRows);
    saveRules();
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && stockList?.length !== rawData?.length) {
      const nextIndex = stockList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 50);
      stockList = [...stockList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    // Initialize the download worker if not already done

    try {
      const savedRules = localStorage?.getItem(pagePathName);

      if (savedRules) {
        const parsedRules = JSON.parse(savedRules);

        // Compare and update ruleOfList based on allRows
        ruleOfList = parsedRules.map((rule) => {
          const matchingRow = allRows.find((row) => row.name === rule.name);
          if (matchingRow && matchingRow.type !== rule.type) {
            return { ...rule, type: matchingRow.type };
          }
          return rule;
        });

        // Check for the user's tier and filter out paywalled features
        if (data?.user?.tier !== "Pro") {
          ruleOfList = ruleOfList.filter((item) =>
            excludedRules.has(item?.rule),
          );
        }

        // Save the updated ruleOfList back to localStorage
        localStorage?.setItem(pagePathName, JSON.stringify(ruleOfList));
      } else {
        // If no saved rules, initialize with the current ruleOfList
        localStorage?.setItem(pagePathName, JSON.stringify(ruleOfList));
      }

      // Update checked items and sort the indicators
      checkedItems = new Set(ruleOfList.map((item) => item.name));
      allRows = sortIndicatorCheckMarks(allRows);

      if (!downloadWorker) {
        const DownloadWorker = await import(
          "$lib/workers/downloadWorker?worker"
        );
        downloadWorker = new DownloadWorker.default();
        downloadWorker.onmessage = handleDownloadMessage;
      }
      await updateStockScreenerData();

      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    } catch (e) {
      console.log(e);
    }
  });

  // Function to generate columns based on keys in rawData
  function generateColumns(data) {
    const leftAlignKeys = new Set(["rank", "symbol", "name"]);

    // Custom labels for specific keys
    const customLabels = {
      changesPercentage: "% Change",
      score: "AI Score",
      researchAndDevelopmentExpenses: "R&D",
      counter: "Ratings Count",
      // Add more key-label mappings here as needed
    };

    // Define preferred order for columns
    const preferredOrder = ["rank", "symbol", "name"];

    // Create a mapping of rule to name and type from allRows
    const ruleToMetadataMap = Object.fromEntries(
      allRows.map((row) => [row.rule, { name: row.name, type: row.type }]),
    );

    // Separate preferred keys and other keys, excluding "type"
    const keys = Object?.keys(data[0])?.filter((key) => key !== "type");

    // Merge the preferred order with the default list order
    const orderedKeys = [
      ...preferredOrder?.filter((key) => keys?.includes(key)),
      ...defaultList
        ?.map((item) => item.rule)
        .filter((key) => keys?.includes(key)),
      ...keys?.filter(
        (key) =>
          !preferredOrder?.includes(key) &&
          !defaultList?.some((item) => item.rule === key),
      ),
    ];

    return orderedKeys?.map((key) => ({
      key,
      label:
        customLabels[key] ||
        ruleToMetadataMap[key]?.name || // Check allRows mapping first
        key?.charAt(0)?.toUpperCase() +
          key?.slice(1).replace(/([A-Z])/g, " $1"),
      type: ruleToMetadataMap[key]?.type || "string", // Add type from allRows or default to 'string'
      align: leftAlignKeys.has(key) ? "left" : "right",
    }));
  }

  // Function to generate sortOrders based on keys in rawData
  function generateSortOrders(data) {
    const stringKeys = new Set([
      "symbol",
      "name",
      "industry",
      "score",
      "sector",
      "analystRating",
    ]);

    return Object.keys(data[0])?.reduce((orders, key) => {
      orders[key] = {
        order: "none",
        type: stringKeys.has(key) ? "string" : "number",
      };
      return orders;
    }, {});
  }

  // Generate columns and sortOrders
  let columns = generateColumns(rawData);
  let sortOrders = generateSortOrders(rawData);

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];

    let originalData = rawData;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle?.length];
    const sortOrder = sortOrders[key]?.order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      stockList = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key]?.toUpperCase();
          valueB = b[key]?.toUpperCase();
          return sortOrder === "asc"
            ? valueA?.localeCompare(valueB)
            : valueB?.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    stockList = [...originalData].sort(compareValues)?.slice(0, 50);
  };

  $: charNumber = $screenWidth < 640 ? 15 : 20;
</script>

<!-- Content area -->

<div class="flex flex-row items-end justify-end w-fit ml-auto mt-5 mb-2">
  <DownloadData {data} {rawData} title={data?.getParams ?? "data"} />

  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button
        builders={[builder]}
        class=" min-w-[110px] w-fit ml-3 border-gray-600 border bg-[#09090B] sm:hover:bg-[#27272A] ease-out flex flex-row justify-between items-center px-3 py-2.5 text-white rounded-md"
      >
        <span class="w-fit text-white text-sm sm:text-[1rem]">Indicators</span>
        <svg
          class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          style="max-width:40px"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </Button>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content
      class="w-60 max-h-[400px] overflow-y-auto scroller relative"
    >
      <!-- Search Input -->
      <div
        class="sticky fixed -top-1 z-40 bg-[#09090B] p-2 border-b border-gray-600"
      >
        <div class="relative w-full">
          <!-- Input Field -->
          <input
            bind:value={searchQuery}
            on:input={handleInput}
            autocomplete="off"
            autofocus=""
            class="text-sm w-full border-0 bg-[#09090B] focus:border-gray-200 focus:ring-0 text-white placeholder:text-gray-300 pr-8"
            type="text"
            placeholder=""
          />

          <!-- Clear Button - Shown only when searchQuery has input -->
          {#if searchQuery?.length > 0}
            <button
              on:click={() => (searchQuery = "")}
              aria-label="Clear"
              title="Clear"
              tabindex="0"
              class="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <svg
                class="h-5 w-5 text-icon cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          {/if}
        </div>
      </div>
      <!-- Dropdown items -->
      <DropdownMenu.Group class="pb-2">
        <!-- Added padding to avoid overlapping with Reset button -->
        {#each searchQuery?.length !== 0 ? testList : allRows as item}
          <DropdownMenu.Item class="sm:hover:bg-[#27272A]">
            <div class="flex items-center">
              {#if defaultRules?.includes(item?.rule)}
                <label
                  on:click|capture={(event) => {
                    event.preventDefault();
                  }}
                  class="text-white"
                >
                  <input
                    disabled={defaultRules?.includes(item?.rule) ? true : false}
                    type="checkbox"
                    class="rounded {defaultRules?.includes(item?.rule)
                      ? 'checked:bg-gray-700'
                      : 'checked:bg-blue-700'}"
                    checked={isChecked(item?.name)}
                  />
                  <span class="ml-2">{item?.name}</span>
                </label>
              {:else if data?.user?.tier === "Pro" || excludedRules?.has(item?.rule)}
                <label
                  on:click|capture={(event) => {
                    event.preventDefault();
                    handleChangeValue(item?.name);
                  }}
                  class="cursor-pointer text-white"
                  for={item?.name}
                >
                  <input
                    disabled={defaultRules?.includes(item?.rule) ? true : false}
                    type="checkbox"
                    class="rounded {defaultRules?.includes(item?.rule)
                      ? 'checked:bg-gray-800'
                      : 'checked:bg-blue-700'}"
                    checked={isChecked(item?.name)}
                  />
                  <span class="ml-2">{item?.name}</span>
                </label>
              {:else}
                <a href="/pricing" class="cursor-pointer text-white">
                  <svg
                    class="h-[18px] w-[18px] inline-block text-icon group-hover:text-dark-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style="max-width:40px"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span class="ml-2">{item?.name}</span>
                </a>
              {/if}
            </div>
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
      <!-- Reset Selection button -->
      <div
        class="sticky -bottom-1 bg-[#09090B] z-50 p-2 border-t border-gray-600 w-full"
      >
        <label
          on:click={handleResetAll}
          class="w-full sm:hover:text-white text-gray-300 bg-[#09090B] text-start text-sm cursor-pointer"
        >
          Reset Selection
        </label>
      </div>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<div class="w-full overflow-x-scroll text-white">
  <table
    class="table table-sm table-compact rounded-none sm:rounded-md w-full border-bg-[#09090B] m-auto mt-4"
  >
    <thead>
      <TableHeader {columns} {sortOrders} {sortData} />
    </thead>
    <tbody>
      {#each stockList as item, index}
        <tr
          class="sm:hover:bg-[#245073] sm:hover:bg-opacity-[0.2] odd:bg-[#27272A] border-b-[#09090B] {index +
            1 ===
            rawData?.length &&
          data?.user?.tier !== 'Pro' &&
          hideLastRow
            ? 'opacity-[0.1]'
            : ''}"
        >
          {#each columns as column}
            <td
              class="text-sm sm:text-[1rem] border-b-[#09090B] whitespace-nowrap"
              class:text-left={column.align === "left"}
              class:text-right={column.align === "right"}
            >
              {#if item[column.key] === null || item[column.key] === undefined}
                -
              {:else if column.key === "symbol"}
                <HoverStockChart symbol={item[column.key]} />
              {:else if column.key === "name"}
                {#if item[column.key]?.length > charNumber}
                  {item[column.key]?.slice(0, charNumber) + "..."}
                {:else}
                  {item[column.key]}
                {/if}
              {:else if column?.type === "int"}
                {abbreviateNumber(item[column.key])}
              {:else if column.key === "price"}
                {item[column.key]?.toFixed(2)}
              {:else if column.type === "percent"}
                {item[column.key]?.toFixed(2) + "%"}
              {:else if column.type === "percentSign"}
                {#if item[column.key] >= 0}
                  <span class="text-[#00FC50]"
                    >+{item[column.key]?.toFixed(2)}%</span
                  >
                {:else}
                  <span class="text-[#FF2F1F]"
                    >{item[column.key]?.toFixed(2)}%</span
                  >
                {/if}
              {:else if column?.type === "rating"}
                {#if ["Strong Buy", "Buy"].includes(item[column.key])}
                  <span class="text-[#00FC50]">{item[column.key]}</span>
                {:else if ["Strong Sell", "Sell"].includes(item[column.key])}
                  <span class="text-[#FF2F1F]">{item[column.key]}</span>
                {:else if item[column.key] === "Hold"}
                  <span class="text-[#FFA838]">{item[column.key]}</span>
                {:else}
                  -
                {/if}
              {:else}
                {item[column.key]}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
