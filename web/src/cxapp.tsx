import { lazy, useEffect, useMemo, type ComponentType, type LazyExoticComponent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SidemenuItem } from "@codexsun/ui/blocks/menu/sidemenu/sub/sidemenu-section";
import {
  ClipboardListIcon,
  Globe2Icon,
  LandmarkIcon,
  MapPinnedIcon,
  PackageIcon,
  Settings2Icon,
  UsersIcon
} from "lucide-react";
import { useCompanyBranding } from "./modules/organisation/company/company.branding";
import { listCompanies } from "./modules/organisation/company/company.services";
import { listFinancialYears } from "./modules/organisation/financial-year/financial-year.services";
import { defaultCompanyQueryKey } from "./modules/organisation/default-company/default-company.hooks";
import {
  getDefaultCompany,
  saveDefaultCompany
} from "./modules/organisation/default-company/default-company.services";

export type CoreWorkspaceContribution = {
  component: LazyExoticComponent<ComponentType>;
  group: string;
  id: string;
  title: string;
};

const workspace = (
  id: string,
  title: string,
  group: string,
  load: () => Promise<{ default: ComponentType }>
): CoreWorkspaceContribution => ({
  component: lazy(load),
  group,
  id,
  title
});

export const coreWebBundle = Object.freeze({
  id: "core",
  title: "Core",
  version: "1.0.49",
  workspaces: Object.freeze([
    workspace("companies", "Companies", "Organisation", () =>
      import("./modules/organisation/company").then((module) => ({
        default: module.CompanyWorkspace
      }))
    ),
    workspace("financial-years", "Financial Years", "Organisation", () =>
      import("./modules/organisation/financial-year").then((module) => ({
        default: module.FinancialYearWorkspace
      }))
    ),
    workspace("default-company", "Default Company", "Organisation", () =>
      import("./modules/organisation/default-company").then((module) => ({
        default: () => <module.DefaultCompanyWorkspace landingApps={cxappLandingApps} />
      }))
    ),
    workspace("contacts", "Contacts", "Masters", () =>
      import("./modules/master/contact").then((module) => ({
        default: module.ContactWorkspace
      }))
    ),
    workspace("products", "Products", "Masters", () =>
      import("./modules/master/product").then((module) => ({
        default: module.ProductWorkspace
      }))
    ),
    workspace("work-orders", "Work Orders", "Masters", () =>
      import("./modules/master/work-order").then((module) => ({
        default: module.WorkOrderWorkspace
      }))
    ),
    workspace("countries", "Countries", "Location", () =>
      import("./modules/common/location/country").then((module) => ({
        default: module.CountryWorkspace
      }))
    ),
    workspace("states", "States", "Location", () =>
      import("./modules/common/location/state").then((module) => ({
        default: module.StateWorkspace
      }))
    ),
    workspace("districts", "Districts", "Location", () =>
      import("./modules/common/location/district").then((module) => ({
        default: module.DistrictWorkspace
      }))
    ),
    workspace("cities", "Cities", "Location", () =>
      import("./modules/common/location/city").then((module) => ({
        default: module.CityWorkspace
      }))
    ),
    workspace("pincodes", "Pincodes", "Location", () =>
      import("./modules/common/location/pincode").then((module) => ({
        default: module.PincodeWorkspace
      }))
    ),
    workspace("ledger-groups", "Ledger Groups", "Accounts", () =>
      import("./modules/common/accounts/ledger-groups").then((module) => ({
        default: module.LedgerGroupsWorkspace
      }))
    ),
    workspace("ledgers", "Ledgers", "Accounts", () =>
      import("./modules/common/accounts/ledgers").then((module) => ({
        default: module.LedgersWorkspace
      }))
    ),
    workspace("address-types", "Address Types", "Contacts", () =>
      import("./modules/common/contacts/address-types").then((module) => ({
        default: module.AddressTypesWorkspace
      }))
    ),
    workspace("bank-names", "Bank Names", "Contacts", () =>
      import("./modules/common/contacts/bank-names").then((module) => ({
        default: module.BankNamesWorkspace
      }))
    ),
    workspace("contact-groups", "Contact Groups", "Contacts", () =>
      import("./modules/common/contacts/contact-groups").then((module) => ({
        default: module.ContactGroupsWorkspace
      }))
    ),
    workspace("contact-types", "Contact Types", "Contacts", () =>
      import("./modules/common/contacts/contact-types").then((module) => ({
        default: module.ContactTypesWorkspace
      }))
    ),
    workspace("currencies", "Currencies", "Others", () =>
      import("./modules/common/others/currencies").then((module) => ({
        default: module.CurrenciesWorkspace
      }))
    ),
    workspace("months", "Months", "Others", () =>
      import("./modules/common/others/months").then((module) => ({
        default: module.MonthsWorkspace
      }))
    ),
    workspace("payment-terms", "Payment Terms", "Others", () =>
      import("./modules/common/others/payment-terms").then((module) => ({
        default: module.PaymentTermsWorkspace
      }))
    ),
    workspace("priorities", "Priorities", "Others", () =>
      import("./modules/common/others/priorities").then((module) => ({
        default: module.PrioritiesWorkspace
      }))
    ),
    workspace("sales-types", "Sales Types", "Others", () =>
      import("./modules/common/others/sales-types").then((module) => ({
        default: module.SalesTypesWorkspace
      }))
    ),
    workspace("brands", "Brands", "Products", () =>
      import("./modules/common/products/brands").then((module) => ({
        default: module.BrandsWorkspace
      }))
    ),
    workspace("colours", "Colours", "Products", () =>
      import("./modules/common/products/colours").then((module) => ({
        default: module.ColoursWorkspace
      }))
    ),
    workspace("hsn-codes", "HSN Codes", "Products", () =>
      import("./modules/common/products/hsn-codes").then((module) => ({
        default: module.HsnCodesWorkspace
      }))
    ),
    workspace("product-categories", "Product Categories", "Products", () =>
      import("./modules/common/products/product-categories").then((module) => ({
        default: module.ProductCategoriesWorkspace
      }))
    ),
    workspace("product-groups", "Product Groups", "Products", () =>
      import("./modules/common/products/product-groups").then((module) => ({
        default: module.ProductGroupsWorkspace
      }))
    ),
    workspace("product-types", "Product Types", "Products", () =>
      import("./modules/common/products/product-types").then((module) => ({
        default: module.ProductTypesWorkspace
      }))
    ),
    workspace("sizes", "Sizes", "Products", () =>
      import("./modules/common/products/sizes").then((module) => ({
        default: module.SizesWorkspace
      }))
    ),
    workspace("styles", "Styles", "Products", () =>
      import("./modules/common/products/styles").then((module) => ({
        default: module.StylesWorkspace
      }))
    ),
    workspace("taxes", "Taxes", "Products", () =>
      import("./modules/common/products/taxes").then((module) => ({
        default: module.TaxesWorkspace
      }))
    ),
    workspace("units", "Units", "Products", () =>
      import("./modules/common/products/units").then((module) => ({
        default: module.UnitsWorkspace
      }))
    ),
    workspace("destinations", "Destinations", "Work Orders", () =>
      import("./modules/common/workorder/destinations").then((module) => ({
        default: module.DestinationsWorkspace
      }))
    ),
    workspace("stock-rejection-types", "Stock Rejection Types", "Work Orders", () =>
      import("./modules/common/workorder/stock-rejection-types").then((module) => ({
        default: module.StockRejectionTypesWorkspace
      }))
    ),
    workspace("transports", "Transports", "Work Orders", () =>
      import("./modules/common/workorder/transports").then((module) => ({
        default: module.TransportsWorkspace
      }))
    ),
    workspace("warehouses", "Warehouses", "Work Orders", () =>
      import("./modules/common/workorder/warehouses").then((module) => ({
        default: module.WarehousesWorkspace
      }))
    ),
    workspace("work-order-types", "Work Order Types", "Work Orders", () =>
      import("./modules/common/workorder/work-order-types").then((module) => ({
        default: module.WorkOrderTypesWorkspace
      }))
    )
  ]),
  embeddedMenuItems(activeWorkspaceId: string, rootPath: string): SidemenuItem[] {
    return coreEmbeddedMenuItems(activeWorkspaceId, rootPath);
  },
  resolveEmbeddedWorkspace(pathname: string, rootPath: string) {
    const prefix = `${rootPath.replace(/\/$/, "")}/core/`;
    if (!pathname.startsWith(prefix)) return undefined;
    const workspaceId = pathname.slice(prefix.length).split("/")[0];
    return this.workspaces.find((entry) => entry.id === workspaceId);
  }
});

const cxappLandingApps = [
  { label: "Application", value: "application" },
  { label: "DevKit", value: "devkit" },
  { label: "Billing", value: "billing" }
];

function coreEmbeddedMenuItems(activeWorkspaceId: string, rootPath: string): SidemenuItem[] {
  const workspaceUrl = (id: string) => `${rootPath.replace(/\/$/, "")}/core/${id}`;
  const item = (id: string, title: string) => ({
    isActive: activeWorkspaceId === id,
    title,
    url: workspaceUrl(id)
  });
  const group = (
    title: string,
    icon: typeof Globe2Icon,
    entries: Array<ReturnType<typeof item>>
  ): SidemenuItem => ({
    icon,
    isActive: entries.some((entry) => entry.isActive),
    items: entries,
    title,
    url: entries[0]!.url
  });

  const location = group("Location", MapPinnedIcon, [
    item("countries", "Countries"),
    item("states", "States"),
    item("districts", "Districts"),
    item("cities", "Cities"),
    item("pincodes", "Pincodes")
  ]);
  const commonGroups = [
    location,
    group("Accounts", LandmarkIcon, [
      item("ledger-groups", "Ledger Groups"),
      item("ledgers", "Ledgers")
    ]),
    group("Contacts", UsersIcon, [
      item("contact-groups", "Contact Groups"),
      item("contact-types", "Contact Types"),
      item("address-types", "Address Types"),
      item("bank-names", "Bank Names")
    ]),
    group("Product", PackageIcon, [
      item("product-groups", "Product Groups"),
      item("product-categories", "Product Categories"),
      item("product-types", "Product Types"),
      item("units", "Units"),
      item("hsn-codes", "HSN Codes"),
      item("taxes", "Taxes"),
      item("brands", "Brands"),
      item("colours", "Colours"),
      item("sizes", "Sizes"),
      item("styles", "Styles")
    ]),
    group("Work Orders", ClipboardListIcon, [
      item("work-order-types", "Work Order Types"),
      item("transports", "Transports"),
      item("warehouses", "Warehouses"),
      item("destinations", "Destinations"),
      item("stock-rejection-types", "Stock Rejection Types")
    ]),
    group("Others", Settings2Icon, [
      item("currencies", "Currencies"),
      item("priorities", "Priorities"),
      item("payment-terms", "Payment Terms"),
      item("sales-types", "Sales Types"),
      item("months", "Months")
    ])
  ];

  return [
    group("Master", PackageIcon, [
      item("contacts", "Contact"),
      item("products", "Product"),
      item("work-orders", "Work Order")
    ]),
    {
      icon: Globe2Icon,
      isActive: commonGroups.some((entry) => entry.isActive),
      items: commonGroups,
      title: "Common",
      url: workspaceUrl("countries")
    }
  ];
}

export function useCoreApplicationContext(enabled = true) {
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({
    enabled,
    queryFn: () => listCompanies(),
    queryKey: ["core", "cxapp", "companies"]
  });
  const financialYearsQuery = useQuery({
    enabled,
    queryFn: listFinancialYears,
    queryKey: ["core", "cxapp", "financial-years"]
  });
  const defaultCompanyQuery = useQuery({
    enabled,
    queryFn: getDefaultCompany,
    queryKey: defaultCompanyQueryKey
  });
  const companies = useMemo(
    () => (companiesQuery.data ?? []).filter((company) => company.isActive),
    [companiesQuery.data]
  );
  const financialYears = useMemo(
    () => (financialYearsQuery.data ?? []).filter((year) => year.status === "active"),
    [financialYearsQuery.data]
  );
  const currentDefault =
    defaultCompanyQuery.data?.status === "active" ? defaultCompanyQuery.data : null;
  const company =
    companies.find((entry) => entry.id === currentDefault?.companyId) ?? companies[0] ?? null;
  const financialYear =
    financialYears.find((entry) => entry.id === currentDefault?.financialYearId) ??
    financialYears.find((entry) => entry.isCurrent) ??
    financialYears[0] ??
    null;
  const branding = useCompanyBranding(enabled ? (company?.id ?? null) : null);
  const selection = useMutation({
    mutationFn: saveDefaultCompany,
    onSuccess: async (record) => {
      publishCoreApplicationContext(record.companyId, record.financialYearId);
      await queryClient.invalidateQueries({ queryKey: defaultCompanyQueryKey });
    }
  });

  useEffect(() => {
    if (company && financialYear) {
      publishCoreApplicationContext(company.id, financialYear.id);
    }
  }, [company, financialYear]);

  function select(companyId: number, financialYearId: number) {
    selection.mutate({
      companyId,
      financialYearId,
      landingApp: currentDefault?.landingApp ?? coreWebBundle.id,
      status: "active"
    });
  }

  return {
    companies,
    company,
    darkLogoUrl: branding.darkLogoUrl,
    error:
      companiesQuery.error ??
      financialYearsQuery.error ??
      defaultCompanyQuery.error ??
      selection.error ??
      null,
    financialYear,
    financialYears,
    isLoading:
      companiesQuery.isLoading ||
      financialYearsQuery.isLoading ||
      defaultCompanyQuery.isLoading ||
      branding.isLoading,
    isSaving: selection.isPending,
    lightLogoUrl: branding.lightLogoUrl,
    selectCompany(companyId: number) {
      if (financialYear) select(companyId, financialYear.id);
    },
    selectFinancialYear(financialYearId: number) {
      if (company) select(company.id, financialYearId);
    }
  };
}

function publishCoreApplicationContext(companyId: number, financialYearId: number) {
  window.localStorage.setItem("codexsun.tenant.company-id", String(companyId));
  window.localStorage.setItem("codexsun.tenant.financial-year-id", String(financialYearId));
  window.dispatchEvent(new CustomEvent("codexsun:company-change", { detail: { id: companyId } }));
  window.dispatchEvent(
    new CustomEvent("codexsun:accounting-year-change", { detail: { id: financialYearId } })
  );
}
