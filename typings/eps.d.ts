declare namespace Eps {
	type RequestOptions = {
		url?: string;
		method?: string;
		data?: any;
		params?: any;
		[key: string]: any;
	};

	type Request = (options?: RequestOptions) => Promise<any>;

	interface AiCallLogEntity {
		/** ID */
		id?: number;

		/** 任务号 */
		recordKey?: string;

		/** 模型编码 */
		modelCode?: string;

		/** 能力 */
		capability?: string;

		/** 形态 */
		mode?: string;

		/** 任务状态 */
		status?: string;

		/** 成功 */
		ok?: number;

		/** 耗时ms */
		latencyMs?: number;

		/** 输入token */
		inputTokens?: number;

		/** 输出token */
		outputTokens?: number;

		/** 总token */
		totalTokens?: number;

		/** 错误码 */
		errorCode?: string;

		/** 错误信息 */
		errorMessage?: string;

		/** 来源 */
		source?: string;

		/** 上游任务ID */
		upstreamId?: string;

		/** 请求参数 */
		request?: any;

		/** 响应结果 */
		result?: any;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface AiModelEntity {
		/** ID */
		id?: number;

		/** 连接 */
		providerId?: number;

		/** 模型编码 */
		code?: string;

		/** 请求路径 */
		path?: string;

		/** 请求方法 */
		method?: string;

		/** 请求体类型 */
		contentType?: string;

		/** 能力 */
		capabilities?: any;

		/** 结果形态 */
		resultModes?: any;

		/** 异步契约 */
		asyncSpec?: any;

		/** 参数提示 */
		inputSchema?: any;

		/** 响应映射 */
		responseSpec?: any;

		/** 校验input */
		validateInput?: number;

		/** 默认参数 */
		defaults?: any;

		/** 状态 */
		status?: number;

		/** 备注 */
		remark?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface AiProviderEntity {
		/** ID */
		id?: number;

		/** 厂商 */
		vendor?: string;

		/** 协议 */
		protocol?: string;

		/** 接口地址 */
		baseUrl?: string;

		/** API密钥 */
		apiKey?: string;

		/** 扩展配置 */
		extra?: any;

		/** 状态 */
		status?: number;

		/** 备注 */
		remark?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface Base_authEntity {
		id?: number;

		[key: string]: any;
	}

	interface Base_commEntity {
		id?: number;

		[key: string]: any;
	}

	interface BaseDepartmentEntity {
		/** ID */
		id?: number;

		/** 上级 */
		parentId?: number;

		/** 名称 */
		name?: string;

		/** 排序 */
		orderNum?: number;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseDictInfoEntity {
		/** ID */
		id?: number;

		/** 字典类型 */
		typeId?: number;

		/** 名称 */
		name?: string;

		/** 值 */
		value?: any;

		/** 排序 */
		orderNum?: number;

		/** 备注 */
		remark?: string;

		/** 上级 */
		parentId?: number;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseDictTypeEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 标识 */
		key?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseLogEntity {
		/** ID */
		id?: number;

		/** 操作者 */
		userId?: string;

		/** 端 */
		side?: string;

		/** IP */
		ip?: string;

		/** 方法 */
		method?: string;

		/** 路径 */
		action?: string;

		/** 日志类型 */
		logType?: string;

		/** 请求参数 */
		params?: string;

		/** 响应 */
		response?: string;

		/** 响应时间 */
		duration?: number;

		/** 状态码 */
		status?: number;

		/** 请求时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseMenuEntity {
		/** ID */
		id?: number;

		/** 上级 */
		parentId?: number;

		/** 名称 */
		name?: string;

		/** 路由 */
		router?: string;

		/** 权限 */
		perms?: string;

		/** 类型 */
		type?: number;

		/** 图标 */
		icon?: string;

		/** 排序 */
		orderNum?: number;

		/** 视图 */
		viewPath?: string;

		/** 远程名 */
		remoteName?: string;

		/** 远程入口 */
		remoteEntry?: string;

		/** 远程模块 */
		remoteModule?: string;

		/** 微应用 */
		appKey?: string;

		/** 路由缓存 */
		keepAlive?: boolean;

		/** 是否显示 */
		isShow?: boolean;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface Base_moduleEntity {
		id?: number;

		[key: string]: any;
	}

	interface Base_openEntity {
		id?: number;

		[key: string]: any;
	}

	interface BasePluginInfoEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 描述 */
		description?: string;

		/** 标识 */
		keyName?: string;

		/** 钩子 */
		hook?: string;

		/** 说明 */
		readme?: string;

		/** 版本 */
		version?: string;

		/** Logo */
		logo?: string;

		/** 作者 */
		author?: string;

		/** 状态 */
		status?: number;

		/** 内容 */
		content?: any;

		/** TS内容 */
		tsContent?: any;

		/** 插件元数据 */
		pluginJson?: any;

		/** 配置 */
		config?: any;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface Base_queueEntity {
		id?: number;

		[key: string]: any;
	}

	interface BaseRoleEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 标识 */
		label?: string;

		/** 备注 */
		remark?: string;

		/** 数据权限 */
		dataScope?: number;

		/** 关联上下级 */
		relevance?: boolean;

		/** 状态 */
		status?: number;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseTaskEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 服务类 */
		service?: string;

		/** 方法 */
		method?: string;

		/** 参数 */
		params?: string;

		/** 任务类型 */
		taskType?: string;

		/** Cron */
		cron?: string;

		/** 执行时间 */
		startDate?: string;

		/** 状态 */
		status?: number;

		/** 备注 */
		remark?: string;

		/** 上次执行 */
		lastRunTime?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseTenantEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 编码 */
		code?: string;

		/** 域名 */
		domains?: any;

		/** 状态 */
		status?: number;

		/** 备注 */
		remark?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface BaseUserEntity {
		/** ID */
		id?: number;

		/** 部门 */
		departmentId?: number;

		/** 关联用户 */
		userId?: number;

		/** 姓名 */
		name?: string;

		/** 用户名 */
		username?: string;

		/** 密码 */
		password?: string;

		/** 密码版本 */
		passwordV?: number;

		/** 昵称 */
		nickName?: string;

		/** 头像 */
		headImg?: string;

		/** 手机号 */
		phone?: string;

		/** 邮箱 */
		email?: string;

		/** 备注 */
		remark?: string;

		/** 状态 */
		status?: number;

		/** Socket */
		socketId?: string;

		/** 超管 */
		isSuper?: boolean;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface UserInfoEntity {
		/** ID */
		id?: string;

		/** 名称 */
		name?: string;

		/** 邮箱 */
		email?: string;

		/** 邮箱已验证 */
		emailVerified?: boolean;

		/** 头像 */
		image?: string;

		/** 手机号 */
		phone?: string;

		/** 手机已验证 */
		phoneVerified?: boolean;

		/** 微信unionid */
		unionid?: string;

		/** 密码 */
		password?: string;

		/** 状态 */
		status?: number;

		/** 创建时间 */
		createdAt?: string;

		/** 更新时间 */
		updatedAt?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface UserRoleEntity {
		/** ID */
		id?: number;

		/** 名称 */
		name?: string;

		/** 标识 */
		label?: string;

		/** 备注 */
		remark?: string;

		/** 状态 */
		status?: number;

		/** 权限 */
		perms?: string;

		/** 创建时间 */
		createTime?: string;

		/** 更新时间 */
		updateTime?: string;

		/** 删除时间 */
		deletedAt?: string;

		[key: string]: any;
	}

	interface Ai_callLog {
		/** 刷新异步进度 */
		refresh(data?: any): Promise<any>;

		/** 失败异步重试 */
		retry(data?: any): Promise<any>;

		/** 超时关单 */
		closeStale(data?: any): Promise<any>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: AiCallLogEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 列表查询 */
		list(data?: any): Promise<AiCallLogEntity[]>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<AiCallLogEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		delete(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { refresh: string; retry: string; closeStale: string; page: string; list: string; info: string; add: string; update: string; delete: string; restore: string };
		_permission: { refresh: boolean; retry: boolean; closeStale: boolean; page: boolean; list: boolean; info: boolean; add: boolean; update: boolean; delete: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Ai_model {
		/** 统一调用模型 */
		call(data?: any): Promise<any>;

		/** schema/厂商预设 */
		presets(data?: any): Promise<any>;

		/** 启用模型目录（含参数提示） */
		catalog(data?: any): Promise<any>;

		/** 套用厂商预设字段 */
		applyPreset(data?: any): Promise<any>;

		/** 连通性探测 */
		test(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<AiModelEntity>;

		/** 列表查询 */
		list(data?: any): Promise<AiModelEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: AiModelEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { call: string; presets: string; catalog: string; applyPreset: string; test: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { call: boolean; presets: boolean; catalog: boolean; applyPreset: boolean; test: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Ai_provider {
		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<AiProviderEntity>;

		/** 列表查询 */
		list(data?: any): Promise<AiProviderEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: AiProviderEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_auth {
		/** 登录 */
		login(data?: any): Promise<any>;

		/** 刷新令牌 */
		refresh(data?: any): Promise<any>;

		/** 退出登录 */
		logout(data?: any): Promise<any>;

		/** 当前用户信息 */
		me(data?: any): Promise<any>;

		/** 权限与菜单 */
		perms(data?: any): Promise<any>;

		page(data?: any): Promise<{ list: Base_authEntity[]; pagination: { page: number; size: number; total: number } }>;

		list(data?: any): Promise<Base_authEntity[]>;

		info(data?: { id: number | string }): Promise<Base_authEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		delete(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { login: string; refresh: string; logout: string; me: string; perms: string; page: string; list: string; info: string; add: string; update: string; delete: string; restore: string };
		_permission: { login: boolean; refresh: boolean; logout: boolean; me: boolean; perms: boolean; page: boolean; list: boolean; info: boolean; add: boolean; update: boolean; delete: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_comm {
		/** 获取云端上传签名 */
		upload(data?: any): Promise<any>;

		page(data?: any): Promise<{ list: Base_commEntity[]; pagination: { page: number; size: number; total: number } }>;

		list(data?: any): Promise<Base_commEntity[]>;

		info(data?: { id: number | string }): Promise<Base_commEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		delete(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { upload: string; page: string; list: string; info: string; add: string; update: string; delete: string; restore: string };
		_permission: { upload: boolean; page: boolean; list: boolean; info: boolean; add: boolean; update: boolean; delete: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_department {
		/** 部门树（扁平） */
		tree(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseDepartmentEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseDepartmentEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseDepartmentEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { tree: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { tree: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_dict_info {
		/** 字典类型列表 */
		types(data?: any): Promise<any>;

		/** 获得字典数据（扁平，前端组树） */
		data(data?: any): Promise<any>;

		/** 按类型 key 获得字典树 */
		get(data?: any): Promise<any>;

		/** 按类型 key + value 找树节点 */
		find(data?: any): Promise<any>;

		/** 存值反查展示名 */
		getValues(data?: any): Promise<any>;

		/** 按名称路径直取树上 value */
		pathValue(data?: any): Promise<any>;

		/** 按父 value + 子名称直取子 value */
		childValue(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseDictInfoEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseDictInfoEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseDictInfoEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { types: string; data: string; get: string; find: string; getValues: string; pathValue: string; childValue: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { types: boolean; data: boolean; get: boolean; find: boolean; getValues: boolean; pathValue: boolean; childValue: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_dict_type {
		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseDictTypeEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseDictTypeEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseDictTypeEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_log {
		/** 清空日志 */
		clear(data?: any): Promise<any>;

		/** 设置保留天数 */
		setKeep(data?: any): Promise<any>;

		/** 获取保留天数 */
		getKeep(data?: any): Promise<any>;

		/** 获取写入日志范围 */
		getScope(data?: any): Promise<any>;

		/** 设置写入日志范围 */
		setScope(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseLogEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseLogEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseLogEntity[]; pagination: { page: number; size: number; total: number } }>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { clear: string; setKeep: string; getKeep: string; getScope: string; setScope: string; delete: string; info: string; list: string; page: string; add: string; update: string; restore: string };
		_permission: { clear: boolean; setKeep: boolean; getKeep: boolean; getScope: boolean; setScope: boolean; delete: boolean; info: boolean; list: boolean; page: boolean; add: boolean; update: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_menu {
		/** 菜单树 */
		tree(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseMenuEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseMenuEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseMenuEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { tree: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { tree: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_module {
		/** 安装业务模块 */
		install(data?: any): Promise<any>;

		/** 已安装业务模块列表 */
		list(data?: any): Promise<Base_moduleEntity[]>;

		/** 卸载业务模块 */
		delete(data?: any): Promise<any>;

		page(data?: any): Promise<{ list: Base_moduleEntity[]; pagination: { page: number; size: number; total: number } }>;

		info(data?: { id: number | string }): Promise<Base_moduleEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { install: string; list: string; delete: string; page: string; info: string; add: string; update: string; restore: string };
		_permission: { install: boolean; list: boolean; delete: boolean; page: boolean; info: boolean; add: boolean; update: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_open {
		/** 实体信息与路径 */
		eps(data?: any): Promise<any>;

		/** 图片验证码 */
		captcha(data?: any): Promise<any>;

		page(data?: any): Promise<{ list: Base_openEntity[]; pagination: { page: number; size: number; total: number } }>;

		list(data?: any): Promise<Base_openEntity[]>;

		info(data?: { id: number | string }): Promise<Base_openEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		delete(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { eps: string; captcha: string; page: string; list: string; info: string; add: string; update: string; delete: string; restore: string };
		_permission: { eps: boolean; captcha: boolean; page: boolean; list: boolean; info: boolean; add: boolean; update: boolean; delete: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_plugin {
		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BasePluginInfoEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BasePluginInfoEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BasePluginInfoEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { add: string; delete: string; update: string; info: string; list: string; page: string; importTemplate: string; import: string; restore: string };
		_permission: { add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; importTemplate: boolean; import: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_queue {
		/** 队列列表 */
		queues(data?: any): Promise<any>;

		/** 队列内任务分页 */
		jobs(data?: any): Promise<any>;

		/** 投递任务 */
		enqueue(data?: any): Promise<any>;

		/** 重试失败任务 */
		retry(data?: any): Promise<any>;

		/** 删除任务 */
		remove(data?: any): Promise<any>;

		/** 清理已完成/失败任务 */
		clean(data?: any): Promise<any>;

		/** 暂停队列 */
		pause(data?: any): Promise<any>;

		/** 恢复队列 */
		resume(data?: any): Promise<any>;

		/** 删除整个队列（含全部任务） */
		obliterate(data?: any): Promise<any>;

		page(data?: any): Promise<{ list: Base_queueEntity[]; pagination: { page: number; size: number; total: number } }>;

		list(data?: any): Promise<Base_queueEntity[]>;

		info(data?: { id: number | string }): Promise<Base_queueEntity>;

		add(data?: any): Promise<any>;

		update(data?: any): Promise<any>;

		delete(data?: any): Promise<any>;

		restore(data?: any): Promise<any>;

		namespace: string;
		permission: { queues: string; jobs: string; enqueue: string; retry: string; remove: string; clean: string; pause: string; resume: string; obliterate: string; page: string; list: string; info: string; add: string; update: string; delete: string; restore: string };
		_permission: { queues: boolean; jobs: boolean; enqueue: boolean; retry: boolean; remove: boolean; clean: boolean; pause: boolean; resume: boolean; obliterate: boolean; page: boolean; list: boolean; info: boolean; add: boolean; update: boolean; delete: boolean; restore: boolean };
		request: Eps.Request;
	}

	interface Base_role {
		/** 角色菜单 */
		menus(data?: any): Promise<any>;

		/** 设置菜单 */
		setMenus(data?: any): Promise<any>;

		/** 角色数据权限部门 */
		departments(data?: any): Promise<any>;

		/** 设置数据权限部门 */
		setDepartments(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseRoleEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseRoleEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseRoleEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { menus: string; setMenus: string; departments: string; setDepartments: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { menus: boolean; setMenus: boolean; departments: boolean; setDepartments: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_task {
		/** 启动任务 */
		start(data?: any): Promise<any>;

		/** 停止任务 */
		stop(data?: any): Promise<any>;

		/** 立即执行 */
		once(data?: any): Promise<any>;

		/** 执行记录 */
		log(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseTaskEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseTaskEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseTaskEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { start: string; stop: string; once: string; log: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { start: boolean; stop: boolean; once: boolean; log: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_tenant {
		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseTenantEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseTenantEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseTenantEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface Base_user {
		/** 用户角色 */
		roles(data?: any): Promise<any>;

		/** 用户角色名映射 */
		roleMap(data?: any): Promise<any>;

		/** 设置角色 */
		setRoles(data?: any): Promise<any>;

		/** 转让超管 */
		transferSuper(data?: any): Promise<any>;

		/** 批量转移部门 */
		moveDepartment(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<BaseUserEntity>;

		/** 列表查询 */
		list(data?: any): Promise<BaseUserEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: BaseUserEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { roles: string; roleMap: string; setRoles: string; transferSuper: string; moveDepartment: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { roles: boolean; roleMap: boolean; setRoles: boolean; transferSuper: boolean; moveDepartment: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface User_info {
		/** 用户角色 */
		roles(data?: any): Promise<any>;

		/** 用户角色名映射 */
		roleMap(data?: any): Promise<any>;

		/** 设置角色 */
		setRoles(data?: any): Promise<any>;

		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<UserInfoEntity>;

		/** 列表查询 */
		list(data?: any): Promise<UserInfoEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: UserInfoEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { roles: string; roleMap: string; setRoles: string; add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { roles: boolean; roleMap: boolean; setRoles: boolean; add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	interface User_role {
		/** 新增 */
		add(data?: any): Promise<any>;

		/** 删除 */
		delete(data?: any): Promise<any>;

		/** 修改 */
		update(data?: any): Promise<any>;

		/** 单个信息 */
		info(data?: { id: number | string }): Promise<UserRoleEntity>;

		/** 列表查询 */
		list(data?: any): Promise<UserRoleEntity[]>;

		/** 分页查询 */
		page(data?: any): Promise<{ list: UserRoleEntity[]; pagination: { page: number; size: number; total: number } }>;

		/** 恢复 */
		restore(data?: any): Promise<any>;

		/** 下载导入模板 */
		importTemplate(data?: any): Promise<any>;

		/** 导入 */
		import(data?: any): Promise<any>;

		namespace: string;
		permission: { add: string; delete: string; update: string; info: string; list: string; page: string; restore: string; importTemplate: string; import: string };
		_permission: { add: boolean; delete: boolean; update: boolean; info: boolean; list: boolean; page: boolean; restore: boolean; importTemplate: boolean; import: boolean };
		request: Eps.Request;
	}

	type Service = {
		request: Request;
		ai: {
			callLog: Ai_callLog;
			model: Ai_model;
			provider: Ai_provider;
		};
		base: {
			auth: Base_auth;
			comm: Base_comm;
			department: Base_department;
			dict: {
				info: Base_dict_info;
				type: Base_dict_type;
			};
			log: Base_log;
			menu: Base_menu;
			module: Base_module;
			open: Base_open;
			plugin: Base_plugin;
			queue: Base_queue;
			role: Base_role;
			task: Base_task;
			tenant: Base_tenant;
			user: Base_user;
		};
		user: {
			info: User_info;
			role: User_role;
		};
	};
}
