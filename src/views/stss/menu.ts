const baseMeta = {
  isLink: "",
  isHide: false,
  isFull: false,
  isAffix: false,
  isKeepAlive: true
};

export const createMenu = (
  path: string,
  name: string,
  component: string,
  title: string,
  icon = "Menu",
  extraMeta: Partial<Menu.MetaProps> = {}
): Menu.MenuOptions => ({
  path,
  name,
  component,
  meta: { ...baseMeta, icon, title, ...extraMeta }
});

export const createGroup = (
  path: string,
  name: string,
  title: string,
  children: Menu.MenuOptions[],
  icon = "Menu",
  redirect = children[0]?.path
): Menu.MenuOptions => ({
  path,
  name,
  redirect,
  meta: { ...baseMeta, icon, title },
  children
});

export const cloneMenuList = (menuList: Menu.MenuOptions[]) => JSON.parse(JSON.stringify(menuList)) as Menu.MenuOptions[];
